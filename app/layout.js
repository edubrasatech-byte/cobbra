import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobbra.ai';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#059669'
};

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Cobbra — Automatize Cobranças e Acabe com a Inadimplência',
    template: '%s | Cobbra'
  },
  description: 'Envie cobranças gentis pelo WhatsApp e e-mail de forma automática. Receba 100% direto no Pix, sem taxas. Mais de 3.500 autônomos já usam o Cobbra para acabar com a inadimplência.',
  keywords: ['cobrança automática', 'cobrança whatsapp', 'inadimplência', 'pix', 'autônomo', 'freelancer', 'lembrete de pagamento', 'cobroo', 'cobbra', 'gestão financeira', 'personal trainer', 'cobrança profissional'],
  authors: [{ name: 'Cobbra' }],
  creator: 'Cobbra',
  publisher: 'Cobbra',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 }
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: BASE_URL,
    siteName: 'Cobbra',
    title: 'Cobbra — Automatize Cobranças e Acabe com a Inadimplência',
    description: 'Envie cobranças gentis pelo WhatsApp. Receba 100% direto no Pix, sem taxas. Grátis para começar.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Cobbra — Cobrança Automática pelo WhatsApp' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cobbra — Automatize Cobranças e Acabe com a Inadimplência',
    description: 'Cobranças automáticas pelo WhatsApp. 0% sobre o que você recebe. Grátis para começar.',
    images: ['/og-image.png']
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg'
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: BASE_URL,
    languages: { 'pt-BR': BASE_URL }
  },
  verification: {}
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" dir="ltr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#059669" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Cobbra',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              description: 'Automatize cobranças gentis por WhatsApp e e-mail. Receba direto no Pix, sem taxas.',
              url: BASE_URL,
              offers: [
                { '@type': 'Offer', name: 'Starter', price: '9.90', priceCurrency: 'BRL', description: 'Até 3 cobranças simultâneas' },
                { '@type': 'Offer', name: 'Crescimento', price: '19.90', priceCurrency: 'BRL', description: 'Até 20 cobranças + WhatsApp + Relatórios' },
                { '@type': 'Offer', name: 'Cobra Pro', price: '49.90', priceCurrency: 'BRL', description: 'Ilimitado + API + Suporte prioritário' }
              ],
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.9',
                reviewCount: '3500',
                bestRating: '5'
              }
            })
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
