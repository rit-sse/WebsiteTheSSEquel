import Image from 'next/image'
import { CTAButton } from '@/components/common/CTAButton';

export default function PrimaryOfficersPolicy() {
    return(<>
        <section className="text-slate-200">
            <div className="text-center flex flex-col items-center w-full max-w-xl">
              <h1
                className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text
                           text-4xl/[3rem] font-extrabold text-transparent sm:text-5xl/[4rem]"
              >
                Primary Officer's Policy
              </h1>
            </div>
        </section>
            <h2
                className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text
                           text-center text-2xl/[3rem] font-extrabold text-transparent sm:text-5xl/[4rem]"
              >
                Introduction
              </h2>
              <p className="text-center mx-auto mt-4 max-w-2xl sm:text-xl/relaxed">
              The Primary Officers' Policy is a living document that chronicles 
              the rules and procedures of the Society of Software Engineers. It is required by the SSE Constitution.
            </p>
        </>
    )
            
}