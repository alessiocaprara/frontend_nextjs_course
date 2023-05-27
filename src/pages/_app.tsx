import '@/styles/globals.scss';
import Footer from '@/components/Footer';
import NavBar from '@/components/NavBar';
import useAuthenticatedUser from '@/hooks/useAuthenticatedUser';
import styles from "@/styles/App.module.css";
import '@/styles/utils.css';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import Head from 'next/head';
import { useRouter } from 'next/router';
import NextNprogress from "nextjs-progressbar";
import { Container, SSRProvider } from "react-bootstrap";
import { useEffect } from 'react';
import AuthModalsProvider from '@/components/auth/AuthModalsProvider';

const inter = Inter({ subsets: ['latin'] });

export default function App({ Component, pageProps }: AppProps) {

  useOnboardingRedirect();

  return (
    <>
      <Head>
        <title>Flow Blog | Share your ideas</title>
        <meta name="description" content="A full-stack NextJS course project by Coding in Flow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:image" key="og:image" content="https://flowblog.com/social_media_preview_image.png" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <SSRProvider>
        <AuthModalsProvider>
          <div className={inter.className}>
            <NextNprogress color="#21FA90" />
            <NavBar />
            <main>
              <Container className={styles.pageContainer}>
                <Component {...pageProps} />
              </Container>
            </main>
            <Footer />
          </div>
        </AuthModalsProvider>
      </SSRProvider>
    </>
  );
}

function useOnboardingRedirect() {
  const { user } = useAuthenticatedUser();
  const router = useRouter();

  useEffect(() => {
    if (user && !user.username && router.pathname !== "/onboarding") {
      router.push("/onboarding?returnTo=" + router.asPath);
    }
  }, [user, router]);
}