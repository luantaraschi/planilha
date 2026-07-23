import type { ReactNode } from "react";
import { GardenIcon } from "@/components/garden-icon";
import styles from "./state-page.module.css";

export function StatePage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <main className={styles.page}>
      <div aria-hidden="true" className={styles.scene}>
        <span className={styles.sun} />
        <span className={styles.stem} />
        <span className={styles.flower}>
          <GardenIcon name="wellbeing" size={46} />
        </span>
        <span className={styles.petals}>
          <i />
          <i />
          <i />
        </span>
      </div>
      <p>{eyebrow}</p>
      <h1>{title}</h1>
      {children ? <div className={styles.action}>{children}</div> : null}
    </main>
  );
}
