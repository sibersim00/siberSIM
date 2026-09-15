import Head from "next/head";
import styles from "./maintenance.module.scss";

const Brand = () => (
  <div className={styles.brand} aria-label="SiberSIM">
    <span className={styles.brandMark} aria-hidden="true">
      <span></span><span></span><span></span>
    </span>
    <span className={styles.brandName}>Siber<span>SIM</span></span>
  </div>
);

const Gear = ({ className }) => (
  <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
    <path d="M44 5h12l3 11c3 1 6 2 9 4l10-6 8 8-6 10c2 3 3 6 4 9l11 3v12l-11 3c-1 3-2 6-4 9l6 10-8 8-10-6c-3 2-6 3-9 4l-3 11H44l-3-11c-3-1-6-2-9-4l-10 6-8-8 6-10c-2-3-3-6-4-9L5 56V44l11-3c1-3 2-6 4-9l-6-10 8-8 10 6c3-2 6-3 9-4L44 5Z" fill="currentColor" />
    <circle cx="50" cy="50" r="18" fill="white" />
  </svg>
);

const MaintenanceDemo = () => (
  <>
    <Head>
      <title>SiberSIM | Scheduled Maintenance</title>
      <meta name="description" content="SiberSIM is undergoing scheduled platform maintenance." />
    </Head>

    <main className={styles.page}>
      <header className={styles.header}>
        <Brand />
        <div className={styles.statusPill}>
          <span></span>
          Maintenance window active
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.maintenanceVisual} aria-label="SiberSIM systems are being maintained">
          <div className={styles.blueprintRing}></div>
          <div className={styles.blueprintRingSmall}></div>
          <span className={`${styles.orbitDot} ${styles.orbitDotOne}`}></span>
          <span className={`${styles.orbitDot} ${styles.orbitDotTwo}`}></span>

          <div className={`${styles.floatingBadge} ${styles.securityBadge}`}>
            <span><i className="fe fe-shield"></i></span>
            <div><small>Security</small><strong>Protected</strong></div>
            <i className="fe fe-check-circle"></i>
          </div>

          <div className={`${styles.floatingBadge} ${styles.dataBadge}`}>
            <span><i className="fe fe-database"></i></span>
            <div><small>Your data</small><strong>Safe & secure</strong></div>
            <i className="fe fe-check-circle"></i>
          </div>

          <div className={styles.machineCard}>
            <div className={styles.machineHeader}>
              <div><span></span><span></span><span></span></div>
              <small>SYSTEM MAINTENANCE</small>
              <i className="fe fe-more-horizontal"></i>
            </div>

            <div className={styles.machineBody}>
              <div className={styles.serverRack}>
                <div className={styles.serverRow}><span></span><i></i><i></i><b></b></div>
                <div className={styles.serverRow}><span></span><i></i><i></i><b></b></div>
                <div className={styles.serverRow}><span></span><i></i><i></i><b></b></div>
              </div>

              <div className={styles.gearAssembly}>
                <Gear className={styles.gearLarge} />
                <Gear className={styles.gearMedium} />
                <Gear className={styles.gearSmall} />
              </div>

              <div className={styles.toolArm}>
                <i className="fe fe-tool"></i>
              </div>
            </div>

            <div className={styles.machineFooter}>
              <span className={styles.activityLight}></span>
              <div>
                <strong>Optimization running</strong>
                <small>Scenario engine · Virtual labs · Core services</small>
              </div>
              <span className={styles.percent}>72%</span>
            </div>
          </div>
        </div>

        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}><i className="fe fe-settings"></i> Planned maintenance</div>
          <h1>SiberSIM is getting<br />a performance upgrade.</h1>
          <p>
            We’re tuning the platform to deliver faster scenarios, more reliable
            virtual labs, and a smoother simulation experience.
          </p>

          <div className={styles.progressBlock}>
            <div className={styles.progressLabels}>
              <span>Upgrade progress</span>
              <strong>72% complete</strong>
            </div>
            <div className={styles.progressTrack}><span></span></div>
            <div className={styles.progressSteps}>
              <div className={styles.done}><i className="fe fe-check"></i><span>Services paused</span></div>
              <div className={styles.done}><i className="fe fe-check"></i><span>Core updated</span></div>
              <div className={styles.active}><i className="fe fe-loader"></i><span>Systems testing</span></div>
              <div><i></i><span>Back online</span></div>
            </div>
          </div>

          <div className={styles.availability}>
            <span className={styles.clockIcon}><i className="fe fe-clock"></i></span>
            <div>
              <small>Expected availability</small>
              <strong>Today, 6:30 PM IST</strong>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.bottomBar}>
        <div>
          <i className="fe fe-lock"></i>
          <span><strong>Everything is protected</strong>Your scenarios and learner progress are unaffected.</span>
        </div>
        <div className={styles.bottomDivider}></div>
        <div>
          <i className="fe fe-mail"></i>
          <span><strong>Need urgent assistance?</strong>Contact us at support@sibersim.com</span>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} SiberSIM</span>
        <span>Cyber simulation. Real readiness.</span>
      </footer>
    </main>
  </>
);

export default MaintenanceDemo;
