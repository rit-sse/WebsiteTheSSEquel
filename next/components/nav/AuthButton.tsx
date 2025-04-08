import { signIn, signOut, useSession } from "next-auth/react";
import HoverBoldButton from "../common/HoverBoldButton";

export default function AuthButton() {
    const { data: session } = useSession();

    if (session) {
        return (
            <HoverBoldButton className="text-left" text="Logout" dataLabel="Logout" onClick={() => signOut()} />
        );
    } else {
        return (
            // Setting the data-label to "Sign Out" is a hack to prevent
            // layout shift when the button changes from "Sign In" to "Sign Out"
            // data-label is used by the bold-pseudo CSS class to display a pseudo-element
            <HoverBoldButton className="text-left" text="Login" dataLabel="Logout" onClick={() => signIn('google')} />
        );
    }
}