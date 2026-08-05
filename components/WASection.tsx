// WhatsApp reply preview — shows users exactly what they receive.
// Server component; the floating phone itself is a thin client child (WAPhone).
import WAPhone from './WAPhone'

export default function WASection() {
  return (
    <section className="wa-section">
      <div className="container">
        <h2 className="section-title">One WhatsApp. All the details.</h2>

        <WAPhone />

        <p className="wa-caption mono">Real format. No spam. One message per search. Your number stays private.</p>
      </div>
    </section>
  )
}
