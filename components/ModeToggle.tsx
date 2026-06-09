'use client'
type Props = { mode: 'buy' | 'drink'; onChange: (m: 'buy' | 'drink') => void }
export default function ModeToggle({ mode, onChange }: Props) {
  return (
    <div className="mode-wrap">
      <button type="button" className={`mode-btn${mode==='buy'?' active':''}`} onClick={()=>onChange('buy')}>
        Find to Buy
      </button>
      <button type="button" className={`mode-btn${mode==='drink'?' active':''}`} onClick={()=>onChange('drink')}>
        Find a Bar
      </button>
    </div>
  )
}
