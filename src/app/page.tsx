import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { currentUser } from "@/lib/session";
import { BrandMark } from "@/components/brand-mark";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Persiapan TOEFL ITP & ProTEFL | reHEARse",
  description:
    "Latihan Listening, Structure, dan Reading, paket soal terarah, serta simulasi diagnostik TOEFL ITP dan ProTEFL dalam satu ruang belajar.",
  openGraph: {
    title: "Persiapan TOEFL ITP & ProTEFL | reHEARse",
    description:
      "Persiapkan diri melalui latihan tiga bagian tes, paket soal, dan simulasi diagnostik yang terarah.",
    locale: "id_ID",
    type: "website",
  },
};

export default async function HomePage() {
  const user = await currentUser();
  const signInHref = user ? "/dashboard" : "/login";

  return (
    <main className="marketing-shell" lang="id">
      <div className="marketing-wrap">
        <nav className="marketing-nav" aria-label="Navigasi utama">
          <BrandMark />
          <div className="marketing-nav-links">
            <a href="#program">Program</a>
            <a href="#skills">Tiga bagian tes</a>
            <a href="#akses">Akses belajar</a>
          </div>
          <div className="marketing-nav-actions">
            <Link href={signInHref} className="marketing-signin">
              {user ? "Ruang belajarku" : "Masuk"}
            </Link>
            {!user && (
              <Link href="/register" className="button button-primary">
                Buat akun <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>
        </nav>

        <section className="marketing-hero" aria-labelledby="hero-title">
          <div className="marketing-hero-copy">
            <p className="marketing-eyebrow">Persiapan TOEFL ITP &amp; ProTEFL</p>
            <h1 id="hero-title">
              Persiapan terarah.
              <br />
              Hadapi tes dengan lebih <span>siap.</span>
            </h1>
            <p className="marketing-lede">
              Latih Listening, Structure, dan Reading lewat soal per bagian,
              paket latihan terpilih, hingga simulasi diagnostik lengkap—dalam
              satu ruang belajar yang tertata.
            </p>
            <div className="marketing-actions">
              <Link href={signInHref} className="button button-primary">
                Masuk ke ruang belajar <span aria-hidden="true">→</span>
              </Link>
              <a href="#program" className="marketing-secondary">
                Lihat program
              </a>
            </div>
            <div className="marketing-trustline" aria-label="Cakupan persiapan">
              <span>Latihan bertahap</span>
              <span>Tiga bagian tes</span>
              <span>Belajar lebih terarah</span>
            </div>
          </div>

          <div className="marketing-art">
            <Image
              src="/art/rehearse/toefl-preparation-still-life.webp"
              alt="Buku latihan, headphone, pensil, dan catatan belajar"
              width={1600}
              height={800}
              sizes="(max-width: 720px) 100vw, 55vw"
              className="marketing-art-image"
              loading="eager"
            />
            <div className="marketing-image-note">
              <strong>Belajar dengan fokus</strong>
              Dari memahami pola soal sampai mengenali bagian yang perlu dilatih.
            </div>
          </div>
        </section>

        <div className="marketing-skills" aria-label="Tiga bagian tes">
          <div className="marketing-skill">
            <span className="marketing-skill-index">01</span>
            <div>
              <strong>Listening</strong>
              <small>Memahami percakapan dan informasi lisan</small>
            </div>
          </div>
          <div className="marketing-skill">
            <span className="marketing-skill-index">02</span>
            <div>
              <strong>Structure</strong>
              <small>Memahami tata bahasa dalam konteks</small>
            </div>
          </div>
          <div className="marketing-skill">
            <span className="marketing-skill-index">03</span>
            <div>
              <strong>Reading</strong>
              <small>Membaca teks akademik dengan cermat</small>
            </div>
          </div>
        </div>

        <section className="marketing-section" id="skills" aria-labelledby="skills-title">
          <div className="marketing-section-heading">
            <p className="marketing-eyebrow">Belajar tiga bagian tes</p>
            <h2 id="skills-title">Persiapan yang lebih utuh, dimulai dari tiap bagian.</h2>
            <p>
              Kenali bentuk soal dan latih strategi yang sesuai untuk Listening,
              Structure, serta Reading pada TOEFL ITP dan ProTEFL.
            </p>
          </div>
          <div className="marketing-skill-grid">
            <article className="marketing-skill-card">
              <span className="marketing-card-icon" aria-hidden="true">♪</span>
              <h3>Listening</h3>
              <p>
                Berlatih menangkap maksud pembicara, detail penting, dan perubahan
                gagasan dalam percakapan maupun penjelasan singkat.
              </p>
            </article>
            <article className="marketing-skill-card">
              <span className="marketing-card-icon" aria-hidden="true">Aa</span>
              <h3>Structure</h3>
              <p>
                Perkuat pemahaman pola kalimat, bentuk kata, dan tata bahasa yang
                sering muncul dalam soal.
              </p>
            </article>
            <article className="marketing-skill-card">
              <span className="marketing-card-icon" aria-hidden="true">¶</span>
              <h3>Reading</h3>
              <p>
                Latih pemahaman gagasan utama, detail, kosakata, dan hubungan
                antargagasan di dalam teks.
              </p>
            </article>
          </div>
        </section>

        <section className="marketing-section" id="program" aria-labelledby="program-title">
          <div className="marketing-section-heading">
            <p className="marketing-eyebrow">Cara berlatih</p>
            <h2 id="program-title">Dari latihan singkat sampai simulasi lengkap.</h2>
            <p>
              Gunakan latihan sesuai kebutuhanmu, lalu lanjutkan ke paket soal
              dan simulasi diagnostik untuk memetakan persiapan berikutnya.
            </p>
          </div>
          <div className="marketing-program-grid">
            <article className="marketing-program-card">
              <span>Latihan per bagian</span>
              <h3>Fokus pada satu skill</h3>
              <p>
                Kerjakan latihan Listening, Structure, atau Reading untuk
                membiasakan diri dengan bentuk dan strategi soal.
              </p>
            </article>
            <article className="marketing-program-card">
              <span>Paket latihan</span>
              <h3>Latihan yang lebih terarah</h3>
              <p>
                Selesaikan paket soal yang disusun untuk membantu belajar secara
                bertahap dan mandiri.
              </p>
            </article>
            <article className="marketing-program-card">
              <span>Simulasi diagnostik</span>
              <h3>Kenali kesiapanmu</h3>
              <p>
                Coba simulasi tes lengkap sebagai bahan untuk menentukan fokus
                belajar dan berdiskusi dengan pengajar.
              </p>
            </article>
          </div>
        </section>

        <section className="marketing-section" id="akses" aria-labelledby="access-title">
          <div className="marketing-access">
            <div>
              <p className="marketing-eyebrow">Ruang belajar personal</p>
              <h2 id="access-title">Materi yang relevan. Langkah belajar yang jelas.</h2>
            </div>
            <div className="marketing-access-copy">
              Pengajar mengatur materi dan latihan yang tersedia untuk setiap
              peserta. Setelah masuk, kamu akan melihat materi yang memang
              ditugaskan untukmu—supaya ruang belajar tetap rapi dan fokus.
              <div className="marketing-access-points">
                <span>Materi dibuka sesuai program dan tahap belajar</span>
                <span>Latihan dan simulasi tersusun dalam satu tempat</span>
                <span>Hasil diagnostik bersifat pribadi dan aksesnya dibatasi</span>
                <span>Langkah persiapan berikutnya lebih mudah dikenali</span>
              </div>
            </div>
          </div>
        </section>

        <section className="marketing-final" aria-labelledby="final-title">
          <p className="marketing-eyebrow">Mulai persiapanmu</p>
          <h2 id="final-title">Satu langkah latihan hari ini, bekal lebih baik untuk hari tes.</h2>
          <p>
            Masuk ke reHEARse untuk membuka materi yang telah disiapkan bagi
            program belajarmu.
          </p>
          <div className="marketing-actions">
            <Link href={signInHref} className="button button-primary">
              {user ? "Buka ruang belajar" : "Masuk ke ruang belajar"}
              <span aria-hidden="true">→</span>
            </Link>
            {!user && (
              <Link href="/register" className="marketing-secondary">
                Buat akun
              </Link>
            )}
          </div>
        </section>

        <footer className="marketing-footer">
          <div className="marketing-footer-top">
            <div className="marketing-footer-brands">
              <BrandMark />
              <span className="marketing-footer-divider" aria-hidden="true" />
              <span className="marketing-footer-affiliation">Bagian dari</span>
              <a
                href="https://najala.org"
                className="marketing-najala-link"
                aria-label="Najala.org — kunjungi situs Najala"
              >
                <Image
                  src="/art/najala/najala-wordmark.png"
                  alt="Najala.org"
                  width={250}
                  height={76}
                  className="marketing-najala-wordmark"
                />
                <Image
                  src="/art/najala/najala-symbol.png"
                  alt=""
                  width={48}
                  height={48}
                  className="marketing-najala-symbol"
                />
                <span className="marketing-najala-mobile-name">Najala.org</span>
              </a>
            </div>
            <p className="marketing-footer-description">
              reHEARse adalah bagian dari Najala.org, platform persiapan TOEFL ITP
              dan ProTEFL untuk latihan Listening, Structure, dan Reading.
            </p>
          </div>
          <div className="marketing-footer-bottom">
            <nav aria-label="Navigasi footer">
              <a href="#program">Program latihan</a>
              <a href="#skills">Tiga bagian tes</a>
              <Link href={signInHref}>{user ? "Ruang belajarku" : "Masuk"}</Link>
            </nav>
            <p>
              Ketentuan pendaftaran dan pelaksanaan tes resmi mengikuti
              informasi dari penyelenggara masing-masing.
            </p>
            <small>© 2026 reHEARse · Bagian dari Najala.org</small>
          </div>
        </footer>
      </div>
    </main>
  );
}
