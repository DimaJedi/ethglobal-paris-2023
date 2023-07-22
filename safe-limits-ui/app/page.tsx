"use client";
import styles from "./page.module.css";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Safe from "@/components/Safe";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <ConnectButton />
        <Safe />
      </div>
    </main>
  );
}
