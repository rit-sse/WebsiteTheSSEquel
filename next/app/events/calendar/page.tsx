import { Metadata } from "next";
import Calendar from "./Calendar";

export const metadata: Metadata = {
    title: "Events Calendar",
    description:
      "The Society of Software Engineers hosts a wide variety of weekly events, ranging from talks and company visits to committee meetings and large seasonal parties."
};

export default function EventsCalendar() {
    return (
        <>
            <div className="flex flex-col items-center w-full h-screen max-w-screen-xl">            
                <div className="mx-auto px-4 sm: py-16 md:pb-8 max-w-2xl">
                    <div className="text-center flex flex-col items-center w-full">
                        <h1
                        className="bg-gradient-to-t from-primary to-secondary bg-clip-text
                                    text-4xl/[3rem] font-extrabold text-transparent md:text-5xl/[4rem]"
                        >
                        Events Calendar
                        </h1>
                    </div>
                </div>

                <Calendar/>
            </div>
        </>
    );
}