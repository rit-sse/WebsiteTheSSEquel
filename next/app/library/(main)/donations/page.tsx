import React from 'react';

export default function BookDonationsPage() {
    return (<div className='w-[80%]'>
        <div className='w-[100%] md:w-[80%]'>
            <h1 className='mt-[10px]'>Book Donations</h1>
            <div className='bg-orange-100 mt-[8px] px-5 py-5 rounded-xl border-[3px] border-orange-200 border-dotted border-spacing-[30px] '>
                <span><b>Hey!</b> We are looking for course-required textbooks. These donations are high in priority, and you can earn double the amount of memberships. Memberships allow you to check out electronics and books from the lab! More information at <a className='underline decoration-solid decoration-[2px] decoration-black font-bold hover:text-[rgba(0,0,0,0.4)] hover:decoration-[rgba(0,0,0,0.4)] duration-200' href='/library/membershipbenefits'>Library Benefits with Memberships FAQ.</a></span>
            </div>
            <p className='mt-[10px]'>Have textbooks gathering dust on your shelf? Turn them into something valuable, both for fellow students and yourself.</p>
            <p className='mt-[10px] font-bold text-[30px]'>How It Works</p>
            <p className='mt-[10px]'>Donating books to the Society of Software Engineers is simple:</p>
            <p className='mt-[10px] ml-[20px]'>1. Drop off your books in the SSE room</p>
            <p className='mt-[10px] ml-[20px]'>2. Notify the mentor on duty that you&apos;re depositing books</p>
            <p className='mt-[10px] ml-[20px]'>3. Get registered, the mentor will note your donation and officers will give you an SSE membership.</p>
            <p className='mt-[10px]'>It&apos;s that easy. Your unused textbooks become accessible course materials for other students, and you gain membership benefits in return.</p>
            <p className='mt-[10px] font-bold text-[30px]'>For Students</p>
            <p className='mt-[10px]'>Every book you donate counts toward your SSE membership. Instead of letting expensive textbooks sit unused after a semester ends, give them a second life while earning your place in the SSE community. It&apos;s a practical exchange that benefits everyone.</p>
            <p className='mt-[10px] font-bold text-[30px]'>For Professors</p>
            <p className='mt-[10px]'>While professors aren&apos;t eligible for membership through donations, there&apos;s an even more valuable opportunity here. By donating required textbooks for your courses, you can:</p>
            <ul className="mt-[10px] ml-[20px] list-disc space-y-2">
                <li>Save your students thousands of dollars on course materials</li>
                <li>Ensure more students have access to essential readings</li>
                <li>Distribute your recommended resources more effectively through the SSE Library system</li>
            </ul>
            <p className='mt-[10px]'>When you pass down textbooks through SSE, you&apos;re not just clearing shelf space—you&apos;re removing financial barriers for students who might otherwise struggle to afford required materials.</p>
            <p className='mt-[10px] font-bold text-[30px]'>Why This Matters</p>
            <p className='mt-[10px]'>Textbook costs add up quickly. A single semester can mean hundreds or thousands of dollars in required books, many of which are used for just one course and then abandoned. This program creates an environment where:</p>
            <ul className="mt-[10px] ml-[20px] list-disc space-y-2">
                <li className='mt-[10px]'>Students get free or low-cost access to the books they need</li>
                <li className='mt-[10px]'>Donors earn membership and declutter their space</li>
                <li className='mt-[10px]'>Professors extend the reach of important course materials</li>
                <li className='mt-[10px]'>The SSE community grows stronger and more accessible</li>
            </ul>

            <p className='mt-[10px] font-bold text-[30px]'>Ready to Donate?</p>
            <p className='mt-[10px]'>Head to the SSE room during lab hours, bring your books, and talk to the mentor on duty. They&apos;ll handle the rest.</p>
            <p className='mt-[10px]'>Every book donated is one less financial burden for a fellow student. That&apos;s knowledge worth sharing.</p>
        </div>
    </div>)
}