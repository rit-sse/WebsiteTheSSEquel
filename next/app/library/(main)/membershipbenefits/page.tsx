import React from 'react';

export default function LibraryMembershipBenefitsPage() {
    return (<div className='w-[80%]'>
        <div className='w-[100%] md:w-[80%]'>
            <h1 className='mt-[10px] font-bold text-[30px]'>Library and SSE Membership Benefits </h1>
            <p className='mt-[10px]'>Welcome to the Society of Software Engineers Library! Your SSE membership unlocks access to valuable resources that support your academic and project needs. Here's everything you need to know about maximizing your membership benefits.</p>

            <h2 className='mt-[10px] font-bold text-[24px]'>How Memberships Work</h2>
            <p className='mt-[10px]'>Each SSE membership you hold acts as a credit system for checking out library resources. Think of memberships as your borrowing power—the more memberships you have, the more resources you can access simultaneously.</p>

            <h2 className='mt-[10px] font-bold text-[24px]'>Textbook Checkout</h2>

            <h3 className='mt-[10px] font-bold text-[20px]'>The Basics</h3>
            <ul className='mt-[10px] list-disc list-inside'>
                <li className='mt-[10px]'><strong>1 membership = 2 textbooks</strong></li>
                <li className='mt-[10px]'><strong>Maximum of 5 textbooks</strong> can be checked out at once, regardless of how many memberships you have</li>
            </ul>

            <h3 className='mt-[10px] font-bold text-[20px]'>Examples</h3>
            <ul className='mt-[10px] list-disc list-inside'>
                <li className='mt-[10px]'>With 1 membership: Check out up to 2 textbooks</li>
                <li className='mt-[10px]'>With 2 memberships: Check out up to 4 textbooks</li>
                <li className='mt-[10px]'>With 3+ memberships: Check out up to 5 textbooks (the maximum limit)</li>
            </ul>
            <p className='mt-[10px]'>This system helps ensure textbooks remain available to all members while giving you the flexibility to access multiple resources for different classes or projects.</p>

            <h2 className='mt-[10px] font-bold text-[24px]'>Equipment Checkout</h2>

            <h3 className='mt-[10px] font-bold text-[20px]'>How Equipment Pricing Works</h3>
            <p className='mt-[10px]'>Equipment checkout uses a credit-based system where each device has a specific "price" in memberships. You can check out any combination of equipment as long as the total membership cost doesn't exceed your available memberships.</p>

            <h3 className='mt-[10px] font-bold text-[20px]'>Key Rules</h3>
            <ul className='mt-[10px] list-disc list-inside'>
                <li className='mt-[10px]'>Each device has its own membership price</li>
                <li className='mt-[10px]'>You can check out multiple devices simultaneously</li>
                <li className='mt-[10px]'>The combined price of all your checked-out devices cannot exceed your total membership count</li>
                <li className='mt-[10px]'>Once you return a device, those membership credits become available again</li>
            </ul>

            <h2 className='mt-[10px] font-bold text-[24px]'>Checking Out Resources</h2>
            <p className='mt-[10px]'>Visit the SSE Library during open hours or check our website for:</p>
            <ul className='mt-[10px] list-disc list-inside'>
                <li className='mt-[10px]'>Current inventory and availability</li>
                <li className='mt-[10px]'>Specific equipment pricing</li>
            </ul>

            <h2 className='mt-[10px] font-bold text-[24px]'>Questions?</h2>
            <p className='mt-[10px]'>Join our discord or visit the lab during lab hours. We're here to help you access the resources you need for academic success and project development.</p>

            <hr className='mt-[10px]' />

            <p className='mt-[10px] italic'>Your SSE membership is your gateway to essential learning resources. Use it wisely, return items on time, and help keep the library accessible for all members!</p>
        </div>
    </div>)
}