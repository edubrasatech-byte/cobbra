const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const cobbraDbPath = path.join(process.cwd(), 'database', 'cobbra.db');
const cobrooDbPath = path.join(process.cwd(), 'database', 'cobroo.db');

async function resetPasswords() {
  const newPassword = 'admin';
  const passwordHash = bcrypt.hashSync(newPassword, 12);
  console.log(`🔑 Generando hash bcrypt para a senha "${newPassword}"...`);

  const dbs = [cobbraDbPath, cobrooDbPath];
  for (const dbPath of dbs) {
    if (fs.existsSync(dbPath)) {
      console.log(`\n📂 Conectando a: ${dbPath}`);
      const db = new Database(dbPath);
      try {
        // Encontra todos os usuários admins
        const admins = db.prepare("SELECT id, name, email, role FROM users WHERE role LIKE '%admin%' OR email LIKE '%admin%'").all();
        console.log(`👥 Admins encontrados:`, admins.map(a => `${a.name} (${a.email})`));

        if (admins.length > 0) {
          const update = db.prepare("UPDATE users SET password_hash = ? WHERE id = ?");
          db.transaction(() => {
            for (const admin of admins) {
              update.run(passwordHash, admin.id);
              console.log(`✅ Senha do admin ${admin.email} resetada para "admin"!`);
            }
          })();
        } else {
          // Se por algum motivo não houver admin, vamos criar um!
          console.log('⚠️ Nenhum admin encontrado no banco! Criando um administrador padrão...');
          const adminId = 'admin-senior-001';
          db.prepare(`
            INSERT INTO users (id, name, email, password_hash, role, plan, status, onboarding_completed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            adminId,
            'Administrador Cobbra',
            'admin@cobbra.com.br',
            passwordHash,
            'admin_senior',
            'enterprise',
            'active',
            1
          );
          console.log(`✅ Administrador padrão (admin@cobbra.com.br / admin) criado com sucesso!`);
        }
      } catch (e) {
        console.error(`❌ Erro no banco ${dbPath}:`, e.message);
      } finally {
        db.close();
      }
    }
  }
}

resetPasswords();
