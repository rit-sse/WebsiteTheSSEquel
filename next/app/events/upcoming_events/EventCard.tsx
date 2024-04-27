import { EventProps } from "./page";

export default function EventCard({ title, description, date, image, location }: EventProps) {
    return (
        <>
            <div className="card w-96 bg-primary text-primary-content">
            <figure><img src= {image} alt="car!"/></figure>
                <div className="card-body">
                    <h2 className="card-title">{title}</h2>
                    <p>{description}</p>
                    <p>{date}</p>
                    <p>{location}</p>
                </div>
            </div>
        </>
    )
}