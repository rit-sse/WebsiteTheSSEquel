export default function Calendar() {
    const calendarLink = "https://calendar.google.com/calendar/embed?height=600&wkst=1&bgcolor=%23ffffff&ctz=America%2FNew_York&showTitle=0&showPrint=0&src=ZXNoNzk0M0BnLnJpdC5lZHU&src=YWRkcmVzc2Jvb2sjY29udGFjdHNAZ3JvdXAudi5jYWxlbmRhci5nb29nbGUuY29t&src=ZW4udXNhI2hvbGlkYXlAZ3JvdXAudi5jYWxlbmRhci5nb29nbGUuY29t&src=Y190MG5udTc4YTlkdHN0YjFjYTgwOTA2N2h2Y0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t&color=%23039BE5&color=%2333B679&color=%230B8043&color=%233F51B5";

    return (
        <>
            <div className="flex flex-col items-center w-screen h-screen max-w-screen-xl">            
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

                <iframe
                    src={calendarLink}
                    className="border border-solid border-gray-700 w-full h-full"
                    frameBorder="0"
                    scrolling="no"
                />
            </div>
        </>
    );
}