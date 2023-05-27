import Link from "next/link";
import { Container, Nav, Navbar, NavDropdown } from "react-bootstrap";
import styles from "@/styles/Footer.module.css";

const Footer = () => {
    return (
        <footer className={styles.footer}>
            <Container>
                <p>© {new Date().getFullYear()} Coding in Flow</p>
                <ul>
                    <li><Link href="/privacy">Privacy</Link></li>
                    <li><Link href="/imprint">Imprint</Link></li>
                </ul>
            </Container>
        </footer>
    );
}

export default Footer;

/**
 * Checked 25_04_2023 21:09 --> OK
 */