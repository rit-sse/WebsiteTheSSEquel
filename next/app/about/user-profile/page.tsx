import UserProfileClient from './UserProfileClient';


export default function UserProfile() {
    return (
        <>
            <section>
                <div className="text-page-structure">
                    <h1>User Profile</h1>
                    <div className="subtitle-structure">
                        <p>
                            This is the user profile page.
                        </p>
                    </div>

                    <UserProfileClient />
                </div>
            </section>
        </>
    );
}