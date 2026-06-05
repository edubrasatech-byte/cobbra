import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  // Simple token security
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('secret') || searchParams.get('token');
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'cobbra-cron-key-135';

  const isAuthorized = (token === cronSecret) || (authHeader === `Bearer ${cronSecret}`);

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Auto-detect active database path (consistent with lib/db.js)
  let dbPath = path.join(process.cwd(), 'database', 'cobbra.db');
  const oldDbPath = path.join(process.cwd(), 'database', 'cobroo.db');
  
  if (fs.existsSync(oldDbPath)) {
    if (!fs.existsSync(dbPath)) {
      dbPath = oldDbPath;
    } else {
      const oldSize = fs.statSync(oldDbPath).size;
      const newSize = fs.statSync(dbPath).size;
      if (oldSize > newSize) {
        dbPath = oldDbPath;
      }
    }
  }

  if (!fs.existsSync(dbPath)) {
    return NextResponse.json({ error: 'Database file not found' }, { status: 404 });
  }

  try {
    // 2. Compress the database file in memory using zlib
    const dbContent = fs.readFileSync(dbPath);
    const compressedDb = zlib.gzipSync(dbContent);

    // 3. Create local backup directory & write compressed copy as primary fallback
    const backupDir = path.join(process.cwd(), 'database', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.db.gz`;
    const localBackupPath = path.join(backupDir, backupFileName);
    
    fs.writeFileSync(localBackupPath, compressedDb);
    console.log(`💾 [BACKUP] Created local compressed backup: ${localBackupPath}`);

    let uploadedToR2 = false;
    let r2Details = 'R2 credentials not set';

    // 4. Try uploading to Cloudflare R2 if credentials are set
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;

    if (endpoint && accessKeyId && secretAccessKey && bucketName) {
      try {
        const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
        
        const s3 = new S3Client({
          endpoint: endpoint,
          region: 'auto',
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });

        await s3.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: `backups/${backupFileName}`,
          Body: compressedDb,
          ContentType: 'application/gzip'
        }));

        uploadedToR2 = true;
        r2Details = `Uploaded to Cloudflare R2 bucket: ${bucketName}`;
        console.log(`✅ [BACKUP R2] Uploaded backup ${backupFileName} successfully!`);

      } catch (r2Err) {
        r2Details = `R2 Upload Failed: ${r2Err.message}`;
        console.error('❌ [BACKUP R2 ERROR]', r2Err);
      }
    }

    // 5. Clean up old local backups to save disk space (keep only last 10 backups)
    try {
      const backupFiles = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('backup-') && f.endsWith('.db.gz'))
        .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime.getTime() }))
        .sort((a, b) => b.time - a.time);

      if (backupFiles.length > 10) {
        const filesToDelete = backupFiles.slice(10);
        for (const file of filesToDelete) {
          fs.unlinkSync(path.join(backupDir, file.name));
          console.log(`🗑️ [BACKUP CLEANUP] Removed old backup file: ${file.name}`);
        }
      }
    } catch (cleanupErr) {
      console.warn('⚠️ [BACKUP CLEANUP WARNING] Failed cleaning up old files:', cleanupErr.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Database backup completed successfully!',
      localPath: localBackupPath,
      r2Status: {
        uploaded: uploadedToR2,
        details: r2Details
      },
      stats: {
        originalSize: `${(dbContent.length / 1024 / 1024).toFixed(2)} MB`,
        compressedSize: `${(compressedDb.length / 1024 / 1024).toFixed(2)} MB`,
        compressionRatio: `${((1 - (compressedDb.length / dbContent.length)) * 100).toFixed(1)}%`
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[CRON BACKUP ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
