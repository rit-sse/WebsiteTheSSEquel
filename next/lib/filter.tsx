import { GoLinkProps } from "@/app/go/GoLink";

/**
 * stub
 */
export function filterGoLinks (filter: string, goLinkData: GoLinkProps[]): GoLinkProps[] {
    filter = filter.toLowerCase()

    let filtered = goLinkData.filter((element) => {
        let name = element.goUrl.toLowerCase()
        let desc = element.description.toLowerCase()
        if(name.includes(filter) || desc.includes(filter)) {
            return element
        }
    })
    
    return filtered
}