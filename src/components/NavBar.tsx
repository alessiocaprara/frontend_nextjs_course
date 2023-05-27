import logo from "@/assets/images/flow-blog-logo.png";
import profilePicPlaceholder from "@/assets/images/profile-pic-placeholder.png";
import useAuthenticatedUser from "@/hooks/useAuthenticatedUser";
import { User } from "@/models/user";
import * as UserApi from "@/network/api/user-api";
import styles from "@/styles/NavBar.module.css";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext } from "react";
import { Button, Container, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { FiEdit } from "react-icons/fi";
import { AuthModalsContext } from "./auth/AuthModalsProvider";

const NavBar = () => {
    const { user } = useAuthenticatedUser();
    const router = useRouter();
    return (
        <Navbar bg="body" expand="md" variant="dark" sticky="top" collapseOnSelect>
            <Container>
                <Navbar.Brand as={Link} href="/" className="d-flex gap-1">
                    <Image src={logo} alt="Flow blog logo" width={30} height={30} />
                    <span className={styles.brandText}>Flow Blog</span>
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="main-navbar" />
                <Navbar.Collapse id="main-navbar">
                    <Nav>
                        <Nav.Link as={Link} href="/" active={router.pathname === "/"}>Home</Nav.Link>
                        <Nav.Link as={Link} href="/blog" active={router.pathname === "/blog"}>Articles</Nav.Link>
                    </Nav>
                    {user ? <LoggedInView user={user} /> : <LoggedOutView />}
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default NavBar;

interface LoggedInViewProps {
    user: User,
}

function LoggedInView({ user }: LoggedInViewProps) {

    const { mutateUser } = useAuthenticatedUser();

    async function logout() {
        try {
            await UserApi.logout();
            mutateUser(null);
        } catch (error) {
            console.error(error);
            alert(error);
        }
    }

    return (
        <Nav className="ms-auto">
            <Nav.Link as={Link} href="/blog/new-post" className="link-primary d-flex align-items-center gap-1">
                <FiEdit />
                Create post
            </Nav.Link>
            <Navbar.Text className="ms-md-3">
                Hey, {user.displayName || "User"}!
            </Navbar.Text>
            <NavDropdown
                className={styles.accountDropdown}
                title={
                    <Image
                        src={user.profilePicUrl || profilePicPlaceholder}
                        width={40}
                        height={40}
                        alt="User profile picture"
                        className="rounded-circle"
                    />
                }>
                {user.username &&
                    <>
                        <NavDropdown.Item as={Link} href={"/users/" + user.username}>Profile</NavDropdown.Item>
                        <NavDropdown.Divider />
                    </>
                }
                <NavDropdown.Item onClick={logout}>Logout</NavDropdown.Item>
            </NavDropdown>
        </Nav>
    );
}

function LoggedOutView() {
    const authModalsContext = useContext(AuthModalsContext);
    return (
        <Nav className="ms-auto">
            <Button
                variant="outline-primary"
                onClick={() => authModalsContext.showLoginModal()}
                className="ms-md-2 mt-2 mt-md-0"
            >
                Log In
            </Button>
            <Button
                onClick={() => authModalsContext.showSignUpModal()}
                className="ms-md-2 mt-2 mt-md-0"
            >
                Sign Up
            </Button>
        </Nav>
    );
}