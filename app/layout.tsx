import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CAPI Payment System',
  description: 'Smart Card-Based Payment System with Subcards for Better Financial Control',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          httpEquiv="Permissions-Policy"
          content="publickey-credentials-create=*, publickey-credentials-get=*"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
