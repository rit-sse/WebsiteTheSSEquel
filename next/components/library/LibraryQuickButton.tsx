

export default function LibraryQuickLink({props}: {props: {label:string, link: string, adminColor?: boolean}}) {
    return(
        <a href={props.link} className={"px-4 py-5 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors duration-200" + (props.adminColor ? " bg-black text-white hover:bg-black-100" : "")}>
            {props.label}
        </a>
    )
}