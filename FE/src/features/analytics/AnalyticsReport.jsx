import { useState } from 'react'
import { ArrowUpRight, Eye, MousePointer2, ScanLine } from 'lucide-react'

const count = new Intl.NumberFormat('id-ID')
const date = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const formatDay = (day) => date.format(new Date(day + 'T00:00:00Z'))

function ActivityChart({ days }) {
  const [selectedDate, setSelectedDate] = useState('')
  const selected = days.find(({ day }) => day === selectedDate) || days.at(-1)
  const peak = Math.max(1, ...days.flatMap(({ views, clicks }) => [views, clicks]))
  return (
    <section className="analytics-panel analytics-trend" aria-labelledby="analytics-trend">
      <div className="analytics-panel-head">
        <div>
          <h2 id="analytics-trend">Aktivitas harian</h2>
          <p>
            {formatDay(days[0].day)} – {formatDay(days.at(-1).day)} · WIB
          </p>
        </div>
        <select
          className="dropdown"
          aria-label="Tanggal aktivitas"
          value={selected.day}
          onChange={(event) => setSelectedDate(event.target.value)}
        >
          {days.map(({ day }) => (
            <option key={day} value={day}>
              {formatDay(day)}
            </option>
          ))}
        </select>
      </div>
      <div className="analytics-chart" style={{ '--chart-days': days.length }} aria-hidden="true">
        {days.map(({ day, views, clicks }) => (
          <div
            key={day}
            data-selected={day === selected.day}
            style={{
              '--views': (views / peak) * 100 + '%',
              '--clicks': (clicks / peak) * 100 + '%',
            }}
          >
            <span />
            <span />
          </div>
        ))}
      </div>
      <div className="analytics-axis" aria-hidden="true">
        <span>{formatDay(days[0].day)}</span>
        <span>{formatDay(days[Math.floor(days.length / 2)].day)}</span>
        <span>{formatDay(days.at(-1).day)}</span>
      </div>
      <dl className="analytics-legend" aria-live="polite">
        <div>
          <dt>Kunjungan</dt>
          <dd>{count.format(selected.views)}</dd>
        </div>
        <div>
          <dt>Klik tautan</dt>
          <dd>{count.format(selected.clicks)}</dd>
        </div>
      </dl>
    </section>
  )
}

export function AnalyticsReport({ days, links }) {
  const totals = days.reduce(
    (sum, day) => ({
      views: sum.views + day.views,
      clicks: sum.clicks + day.clicks,
      qrViews: sum.qrViews + day.qrViews,
    }),
    { views: 0, clicks: 0, qrViews: 0 },
  )
  return (
    <>
      <dl className="analytics-metrics">
        {[
          ['Kunjungan halaman', totals.views, Eye],
          ['Klik tautan', totals.clicks, MousePointer2],
          ['Kunjungan dari QR', totals.qrViews, ScanLine],
        ].map(([label, value, Icon]) => (
          <div key={label}>
            <dt>
              <Icon size={17} aria-hidden="true" />
              {label}
            </dt>
            <dd>{count.format(value)}</dd>
          </div>
        ))}
      </dl>
      {totals.views === 0 && totals.clicks === 0 && (
        <p className="analytics-empty">
          Belum ada aktivitas pada periode ini. Bagikan halaman publik atau unduh QR baru untuk
          mulai melihat kunjungan.
        </p>
      )}
      <div className="analytics-report">
        <ActivityChart days={days} />
        <section className="analytics-panel analytics-ranking" aria-labelledby="analytics-ranking">
          <div className="analytics-panel-head">
            <div>
              <h2 id="analytics-ranking">Tautan teratas</h2>
              <p>Diurutkan berdasarkan klik</p>
            </div>
            <ArrowUpRight size={21} aria-hidden="true" />
          </div>
          {links.length ? (
            <ol>
              {links.map(({ id, title, clicks }) => (
                <li key={id}>
                  <div>
                    <span>{title || 'Tautan dihapus'}</span>
                    <strong>{count.format(clicks)} klik</strong>
                  </div>
                  <span aria-hidden="true" className="analytics-ranking-track">
                    <span style={{ width: (clicks / links[0].clicks) * 100 + '%' }} />
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p>Belum ada klik yang tercatat.</p>
          )}
        </section>
      </div>
    </>
  )
}
