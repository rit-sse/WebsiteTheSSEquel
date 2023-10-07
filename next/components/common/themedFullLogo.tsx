import Image from 'next/image'
import { useTheme } from 'next-themes'
import { Theme } from '@/types/theme'

function ThemedFullLogo() {
    const { resolvedTheme } = useTheme()
    let src

    switch (resolvedTheme) {
        case Theme.Light:
            src = 'sse-full-lightmode.svg'
            break
        case Theme.Dark:
            src = 'sse-full-darkmode.svg'
            break
        default:
            src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
            break
    }

    return <Image src={src} className='py-2' width={250} height={250} alt='Society of Software Engineers Logo' />
}

export default ThemedFullLogo