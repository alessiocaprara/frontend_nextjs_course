import GithubSignInButton from "./GithubSignInButton";
import GoogleSignInButton from "./GoogleSignInButton";

export default function SocialSignInSection() {
    return (
        <div className="d-flex flex-column gap-2" >
            <GoogleSignInButton />
            <GithubSignInButton />
        </div>
    );
}

