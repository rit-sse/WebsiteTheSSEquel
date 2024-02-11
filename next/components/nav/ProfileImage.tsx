import { useSession } from "next-auth/react";

export default function ProfileImage() {
    const { data : session } = useSession();
    if(session) {

        return (
            <img src='https://source.boringavatars.com/beam/' className="visible h-10 w-10" />
        );
    } else {
        return (
            <img src='https://source.boringavatars.com/beam/' className="invisible h-10 w-10" />
        );
    }
}