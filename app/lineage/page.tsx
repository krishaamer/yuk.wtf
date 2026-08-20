import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Lineage | YUK.WTF",
  description:
    "The Git ancestry and wider project lineage behind YUK, from World Cleanup mapping and open data to WADE, TrashAI and the 2026 rebuild.",
};

export default function LineagePage() {
  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <a className={styles.wordmark} href="/" aria-label="Back to YUK.WTF">
          YUK<span>.WTF</span>
        </a>
        <a className={styles.back} href="/">
          ← feed the monster
        </a>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>PROJECT ARCHAEOLOGY 🦴💾🗑️</p>
        <h1>this monster has ancestors.</h1>
        <p className={styles.intro}>
          YUK comes from more than one strand of waste-tech history. Some of it is literal Git ancestry.
          Some of it is a wider family of open-data and computer-vision projects. This page keeps those
          relationships separate instead of flattening everything into one fake family tree.
        </p>
        <div className={styles.legend} aria-label="Lineage legend">
          <span><i className={styles.solidLine} /> actual Git ancestry</span>
          <span><i className={styles.dashedLine} /> project / idea lineage</span>
        </div>
      </section>

      <section className={styles.origin}>
        <p className={styles.year}>2017</p>
        <div>
          <p className={styles.kicker}>shared origin</p>
          <h2>Let&apos;s Do It / World Cleanup</h2>
          <p>
            Waste mapping, public data and later machine-assisted recognition develop as related responses
            to the same problem: turning visible waste into usable evidence.
          </p>
        </div>
      </section>

      <section className={styles.lanes} aria-label="YUK project lineage">
        <article className={`${styles.lane} ${styles.dataLane}`}>
          <div className={styles.laneHeader}>
            <span>01</span>
            <h2>open data</h2>
          </div>

          <div className={styles.node}>
            <p className={styles.year}>2017</p>
            <h3>Open Data Web</h3>
            <p>Map + timeline frontend for Let&apos;s Do It World open waste data.</p>
            <a href="https://github.com/zerowasteestonia/opendata-web" target="_blank" rel="noreferrer">
              repository ↗
            </a>
          </div>

          <div className={styles.connector}><span>shared data layer</span></div>

          <div className={styles.node}>
            <p className={styles.year}>2017</p>
            <h3>Open Data API</h3>
            <p>PostgreSQL-backed reports, sources, imports and API infrastructure.</p>
            <a href="https://github.com/zerowasteestonia/opendata-api" target="_blank" rel="noreferrer">
              repository ↗
            </a>
          </div>

          <div className={`${styles.connector} ${styles.conceptConnector}`}><span>data ideas</span></div>
        </article>

        <article className={`${styles.lane} ${styles.captureLane}`}>
          <div className={styles.laneHeader}>
            <span>02</span>
            <h2>field capture</h2>
          </div>

          <div className={styles.node}>
            <p className={styles.year}>2017-2018</p>
            <h3>World Cleanup mapping</h3>
            <p>Mobile + web mapping, photos, trashpoints, geolocation, teams and cleanup workflows.</p>
          </div>

          <div className={styles.connector}><span>2018 split</span></div>

          <div className={styles.forkGrid}>
            <div className={`${styles.node} ${styles.gitNode}`}>
              <p className={styles.year}>2018</p>
              <h3>Haamer / Expo</h3>
              <p>Earlier Expo and open-source generation.</p>
              <code>05c2832</code>
            </div>
            <div className={`${styles.node} ${styles.gitNode}`}>
              <p className={styles.year}>2018</p>
              <h3>WCD / React Native</h3>
              <p>Later regular React Native generation.</p>
              <code>1896cb0</code>
            </div>
          </div>

          <div className={`${styles.connector} ${styles.gitConnector}`}><span>reunited in Git · 2026</span></div>
        </article>

        <article className={`${styles.lane} ${styles.aiLane}`}>
          <div className={styles.laneHeader}>
            <span>03</span>
            <h2>computer vision</h2>
          </div>

          <div className={styles.node}>
            <p className={styles.year}>2018</p>
            <h3>WADE AI</h3>
            <p>Let&apos;s Do It World work on detecting trash in geolocated images.</p>
            <a href="https://github.com/zerowasteestonia/wade-ai" target="_blank" rel="noreferrer">
              repository ↗
            </a>
          </div>

          <div className={`${styles.connector} ${styles.conceptConnector}`}><span>inspires / superseded by</span></div>

          <div className={styles.node}>
            <p className={styles.year}>2021</p>
            <h3>TrashAI</h3>
            <p>Web-based litter image classification for research.</p>
            <a href="https://github.com/opensacorg/trash-ai" target="_blank" rel="noreferrer">
              upstream ↗
            </a>
          </div>

          <div className={styles.connector}><span>GitHub fork</span></div>

          <div className={styles.node}>
            <p className={styles.year}>2022</p>
            <h3>Zero Waste Estonia TrashAI</h3>
            <p>The Zero Waste Estonia fork of the later TrashAI project.</p>
            <a href="https://github.com/zerowasteestonia/trash-ai" target="_blank" rel="noreferrer">
              repository ↗
            </a>
          </div>

          <div className={`${styles.connector} ${styles.conceptConnector}`}><span>models + tooling ideas</span></div>
        </article>
      </section>

      <section className={styles.yukNode}>
        <div className={styles.yukFace}>🤢</div>
        <div>
          <p className={styles.year}>2026</p>
          <p className={styles.kicker}>recombined, not merely revived</p>
          <h2>YUK</h2>
          <p>
            Camera-first capture from the mapping lineage. Open observational data from the open-data lineage.
            AI interpretation from the WADE / TrashAI lineage. Provenance, confidence and state over time instead
            of pretending one report is permanent truth.
          </p>
        </div>
      </section>

      <section className={styles.precision}>
        <div>
          <p className={styles.kicker}>important distinction</p>
          <h2>Git history ≠ project history.</h2>
        </div>
        <div className={styles.precisionCopy}>
          <p>
            Only the two preserved 2018 mobile heads are parents of YUK&apos;s repository history. Open Data,
            WADE and TrashAI belong to the wider intellectual and product lineage, not the commit graph.
          </p>
          <p>
            That distinction lets YUK tell the bigger story without inventing ancestry that Git cannot prove.
          </p>
        </div>
      </section>

      <section className={styles.links}>
        <a href="https://github.com/krishaamer/yuk.wtf/blob/main/docs/archaeology/ECOSYSTEM.md" target="_blank" rel="noreferrer">
          full ecosystem notes ↗
        </a>
        <a href="https://github.com/krishaamer/yuk.wtf/blob/main/docs/archaeology/TIMELINE.md" target="_blank" rel="noreferrer">
          historical timeline ↗
        </a>
        <a href="https://github.com/krishaamer/yuk.wtf" target="_blank" rel="noreferrer">
          source ↗
        </a>
      </section>

      <footer className={styles.footer}>
        <span>yuk.wtf</span>
        <span>trash has history too</span>
      </footer>
    </main>
  );
}
