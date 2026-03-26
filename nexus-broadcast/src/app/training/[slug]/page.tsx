import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTrainingModule, trainingModules } from '../training-data'

type ModulePageProps = {
  params: {
    slug: string
  }
}

export function generateStaticParams() {
  return trainingModules.map((module) => ({ slug: module.slug }))
}

export function generateMetadata({ params }: ModulePageProps) {
  const module = getTrainingModule(params.slug)

  if (!module) {
    return {
      title: 'Training Module Not Found',
    }
  }

  return {
    title: `${module.title} | Nexus Training`,
    description: module.summary,
  }
}

export default function TrainingModulePage({ params }: ModulePageProps) {
  const module = getTrainingModule(params.slug)

  if (!module) {
    notFound()
  }

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Training Module</p>
          <h1>{module.title}</h1>
          <p className="lede">{module.goal}</p>
        </div>
        <div className="heroMeta">
          <div className="statusPill live">{module.level}</div>
          <div className="statusPill subtle">{module.duration}</div>
          <Link href="/training" className="ghostButton">
            Back to training hub
          </Link>
        </div>
      </section>

      <section className="workspace" style={{ marginTop: 20 }}>
        <div className="primaryColumn">
          <article className="panel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">Overview</p>
                <h2>What this module teaches</h2>
              </div>
            </div>
            <p className="trainingText">{module.summary}</p>
            <div className="trainingSection">
              <h3>Prerequisites</h3>
              <ul className="trainingList">
                {module.prerequisites.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="trainingSection">
              <h3>Outcomes</h3>
              <ul className="trainingList">
                {module.outcomes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </article>

          <article className="panel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">Procedure</p>
                <h2>Runbook-style steps</h2>
              </div>
            </div>
            <div className="moduleStepList">
              {module.steps.map((step, index) => (
                <section key={step.title} className="moduleStepCard">
                  <div className="trainingCardHeader">
                    <span className="badge live">Step {index + 1}</span>
                  </div>
                  <h3>{step.title}</h3>
                  <p className="trainingText">{step.detail}</p>
                  <ul className="trainingList">
                    {step.checklist.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </article>
        </div>

        <aside className="sideColumn">
          <article className="panel compactPanel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">Practice</p>
                <h2>Recommended drills</h2>
              </div>
            </div>
            <ul className="trainingList">
              {module.drills.map((drill) => (
                <li key={drill}>{drill}</li>
              ))}
            </ul>
          </article>

          <article className="panel compactPanel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">Next step</p>
                <h2>Continue learning</h2>
              </div>
            </div>
            <div className="trainingNavList">
              {trainingModules
                .filter((candidate) => candidate.slug !== module.slug)
                .map((candidate) => (
                  <Link key={candidate.slug} href={`/training/${candidate.slug}`} className="ghostButton">
                    {candidate.title}
                  </Link>
                ))}
            </div>
          </article>
        </aside>
      </section>
    </main>
  )
}
