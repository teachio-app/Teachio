import { ClientProviders } from '@/components/ui/ClientProviders'

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientProviders>
      {children}
    </ClientProviders>
  )
}
