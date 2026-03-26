import Link from 'next/link'
import { trainingModules } from './training-data'

export const metadata = {
  title: 'Nexus Training Hub',
  description: 'Operator training for running Nexus Broadcast Orchestrate in live production environments.',
}

export default function TrainingHubPage() {
  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Training Hub</p>
          <h1>Operator training for launching, routing, recovering, and handing over the Nexus system.</h1>
          <p className="lede">
            Use these guided modules to learn how to run the platform under normal conditions, during peak events, and during incident recovery.
          </p>
        </div>
        <div className="heroMeta">
          <div className="statusPill live">{trainingModules.length} modules</div>
          <Link href="/" className="ghostButton">
            Return to control room
          </Link>
        </div>
      </section>

      <section className="panel" style={{ marginTop: 20 }}>
        <div className="panelHeader">
          <div>
            <p className="panelLabel">Curriculum</p>
            <h2>Recommended learning path</h2>
          </div>
        </div>
        <div className="trainingGrid">
          {trainingModules.map((module, index) => (
            <article key={module.slug} className="trainingCard">
              <div className="trainingCardHeader">
                <span className="badge standby">Module {index + 1}</span>
                <span className="statusPill subtle">{module.duration}</span>
              </div>
              <h3>{module.title}</h3>
              <p>{module.summary}</p>
              <div className="trainingMeta">
                <small>Level: {module.level}</small>
                <small>Goal: {module.goal}</small>
              </div>
              <Link href={`/training/${module.slug}`} className="ghostButton">
                Open module
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
