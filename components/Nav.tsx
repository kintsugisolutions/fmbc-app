import Image from 'next/image'

export default function Nav() {
  return (
    <nav className="nav">
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
      <span className="nav-badge mono">Ludhiana · Members Only</span>
    </nav>
  )
}
