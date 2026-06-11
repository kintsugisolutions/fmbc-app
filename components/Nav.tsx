import Image from 'next/image'
import { Suspense } from 'react'
import StoreCount from './StoreCount'
import NavScrollEffect from './NavScrollEffect'

export default function Nav() {
  return (
    <nav className="nav">
      <NavScrollEffect />
      <div className="nav-left">
        <Image
          src="/fmbc_icon.png"
          alt="FMBC"
          width={28}
          height={28}
          className="nav-logo"
          priority
        />
        <span className="nav-brand">Find My Bottle Club</span>
      </div>
      <div className="nav-right">
        {/* Only renders once stores are added to the DB — invisible until then */}
        <Suspense fallback={null}>
          <StoreCount />
        </Suspense>
        <span className="nav-badge mono">Ludhiana · Members Only</span>
      </div>
    </nav>
  )
}
