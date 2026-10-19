import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <span className={styles.wordmark}>MGaye</span>
        <nav className={styles.nav}>
          <Link href="/login" className={styles.navLink}>
            Se connecter
          </Link>
          <Link href="/register" className={styles.navCta}>
            Créer un compte
          </Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <p className={styles.kicker}>Un éditeur de documents</p>
        <h1 className={styles.heroTitle}>
          Écrivez, mettez en page,
          <br />
          composez.
        </h1>
        <p className={styles.heroLead}>
          Atelier réunit le texte, l'image, le tableau et le graphique dans un
          seul document, sans jongler entre dix outils. Pensé pour produire des
          documents prêts à publier — rapports, propositions, notes internes —
          avec une mise en page soignée par défaut.
        </p>
        <div className={styles.heroActions}>
          <Link href="/register" className={styles.primaryBtn}>
            Commencer à écrire
          </Link>
          <Link href="/login" className={styles.secondaryBtn}>
            J'ai déjà un compte
          </Link>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.feature}>
          <h3>Texte riche</h3>
          <p>
            Titres, listes, citations, alignement, couleurs — une frappe fluide,
            sans friction.
          </p>
        </div>
        <div className={styles.feature}>
          <h3>Images & graphiques</h3>
          <p>
            Glissez une image ou insérez un graphique directement dans le fil du
            document.
          </p>
        </div>
        <div className={styles.feature}>
          <h3>Tableaux</h3>
          <p>
            Construisez des tableaux redimensionnables, avec en-têtes et
            cellules fusionnables.
          </p>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>MGaye — édition de documents</span>
      </footer>
    </main>
  );
}
