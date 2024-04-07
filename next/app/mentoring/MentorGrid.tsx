import { MentorGridProps} from "./page";

const MentorGrid: React.FC<MentorGridProps> = ({schedule}) => {
    return (
        
        <div className="w-1/2">

        {/* Gibberish -- Shows how to display */}
        <div className="mentor-grid">
            {Object.entries(schedule).map(([day, daySchedule]) => (
                <div key={day} className="day-schedule">
                    <h2>{day}</h2>
                    <div>
                        {Object.entries(daySchedule).map(([hour, mentors]) => (
                            <div key={hour} className="hour-schedule">
                                <h3>{hour}</h3>
                                <ul>
                                    {mentors.map((mentor, index) => (
                                        <li key={index}>{mentor}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>





            <div id='content'>
            <div id='mentor-calendar'>
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='-10 -10 300 470'>
            <text id='a'></text>
            
            <path className='kovu' d="M45 45 h 45 v45 h-45 z"/>
            <path className='kovu' d="M90 45 h 45 v45 h-45 z"/>
            <path className='kovu' d="M135 45 h 45 l-45 45 z"/>
            <path className='greg' d="M180 45 v45 h-45 z"/>
            <path className='greg' d="M180 45 v45 h-45 z"/>
            <path className='jon' d="M180 45 h 45 v45 h-45 z"/>
            <path className='kovu' d="M225 45 h 45 v45 h-45 z"/>

            <path className='cass' d="M45 90 h 45 l-45 45 z"/>
            <path className='mackenzie' d="M90 90 v45 h-45 z"/>
            <path className='aidan' d="M90 90 h 45 l-45 45 z"/>
            <path className='issac' d="M135 90 v45 h-45 z"/>
            <path className='cass' d="M135 90 h 45 l-45 45 z"/>
            <path className='mackenzie' d="M180 90 v45 h-45 z"/>
            <path className='aidan' d="M180 90 h 45 l-45 45 z"/>
            <path className='issac' d="M225 90 v45 h-45 z"/>
            <path className='mackenzie' d="M225 90 h 45 v45 h-45 z"/>

            <path className='cass' d="M45 135 h 45 l-45 45 z"/>
            <path className='max' d="M90 135 v45 h-45 z"/>
            <path className='issac' d="M90 135 h 45 v45 h-45 z"/>
            <path className='cass' d="M135 135 h 45 l-45 45 z"/>
            <path className='max' d="M180 135 v45 h-45 z"/>
            <path className='greg' d="M180 135 h 45 l-45 45 z"/>
            <path className='issac' d="M225 135 v45 h-45 z"/>
            <path className='max' d="M225 135 h 45 v45 h-45 z"/>

            <path className='aditya' d="M45 180 h 45 l-45 45 z"/>
            <path className='mackenzie' d="M90 180 v45 h-45 z"/>
            <path className='greg' d="M90 180 h 45 l-45 45 z"/>
            <path className='ryan' d="M135 180 v45 h-45 z"/>
            <path className='aditya' d="M135 180 h 45 v45 h-45 z"/>
            <path className='greg' d="M180 180 h 45 l-45 45 z"/>
            <path className='ryan' d="M225 180 v45 h-45 z"/>
            <path className='max' d="M225 180 h 45 v45 h-45 z"/>

            <path className='anthony' d="M45 225 h 45 l-45 45 z"/>
            <path className='luke' d="M90 225 v45 h-45 z"/>
            <path className='jon' d="M90 225 h 45 l-45 45 z"/>
            <path className='ryan' d="M135 225 v45 h-45 z"/>
            <path className='anthony' d="M135 225 h 45 l-45 45 z"/>
            <path className='luke' d="M180 225 v45 h-45 z"/>
            <path className='ryan' d="M180 225 h 45 v45 h-45 z"/>
            <path className='anthony' d="M225 225 h 45 v45 h-45 z"/>

            <path className='aneesh' d="M45 270 h 45 l-45 45 z"/>
            <path className='luke' d="M90 270 v45 h-45 z"/>
            <path className='jon' d="M90 270 h 45 l-45 45 z"/>
            <path className='nick' d="M135 270 v45 h-45 z"/>
            <path className='aneesh' d="M135 270 h 45 l-45 45 z"/>
            <path className='luke' d="M180 270 v45 h-45 z"/>
            <path className='nick' d="M180 270 h 45 v45 h-45 z"/>
            <path className='anthony' d="M225 270 h 45 v45 h-45 z"/>

            <path className='aneesh' d="M45 315 h 45 l-45 45 z"/>
            <path className='joseph' d="M90 315 v45 h-45 z"/>
            <path className='aidan' d="M90 315 h 45 l-45 45 z"/>
            <path className='sydney' d="M135 315 v45 h-45 z"/>
            <path className='aneesh' d="M135 315 h 45 l-45 45 z"/>
            <path className='joseph' d="M180 315 v45 h-45 z"/>
            <path className='aidan' d="M180 315 h 45 l-45 45 z"/>
            <path className='sydney' d="M225 315 v45 h-45 z"/>
            <path className='aditya' d="M225 315 h 45 v45 h-45 z"/>

            <path className='hridiza' d="M45 360 h 45 l-45 45 z"/>
            <path className='joseph' d="M90 360 v45 h-45 z"/>
            <path className='hridiza' d="M90 360 h 45 l-45 45 z"/>
            <path className='sydney' d="M135 360 v45 h-45 z"/>
            <path className='hridiza' d="M135 360 h 45 l-45 45 z"/>
            <path className='joseph' d="M180 360 v45 h-45 z"/>
            <path className='jon' d="M180 360 h 45 l-45 45 z"/>
            <path className='sydney' d="M225 360 v45 h-45 z"/>
            <path className='aditya' d="M225 360 h 45 v45 h-45 z"/>

            <circle cx="157.5" cy="67.5" r="1" />
            <text x="45" y="70">Kovu</text>
            <text x="90" y="70">Kovu</text>
            <text x="157.5" y="62" transform='rotate(-45, 157.5, 67.5)' className='small-name' >Kovu</text>
            <text x="157.5" y="80" transform='rotate(-45, 157.5, 67.5)' className='small-name'>Greg</text>
            <text x="180" y="70">Jon</text>
            <text x="225" y="70">Kovu</text>

            <text x="67.5" y="110" transform='rotate(-45, 67.5, 112.5)' className='small-name'>Cass</text>
            <text x="67.5" y="125" transform='rotate(-45, 67.5, 112.5)' className='small-name mackenzie'>Mackenzie</text>
            <text x="112.5" y="110" transform='rotate(-45, 112.5, 112.5)' className='small-name'>Aidan</text>
            <text x="112.5" y="125" transform='rotate(-45, 112.5, 112.5)' className='small-name'>Issac</text>
            <text x="157.5" y="110" transform='rotate(-45, 157.5, 112.5)' className='small-name'>Cass</text>
            <text x="157.5" y="125" transform='rotate(-45, 157.5, 112.5)' className='small-name mackenzie'>Mackenzie</text>
            <text x="202.5" y="110" transform='rotate(-45, 202.5, 112.5)' className='small-name'>Aidan</text>
            <text x="202.5" y="125" transform='rotate(-45, 202.5, 112.5)' className='small-name'>Issac</text>

            <text x="67.5" y="155" transform='rotate(-45, 67.5, 157.5)' className='small-name'>Cass</text>
            <text x="67.5" y="170" transform='rotate(-45, 67.5, 157.5)' className='small-name'>Max</text>


            <text x="157.5" y="155" transform='rotate(-45, 157.5, 157.5)' className='small-name'>Cass</text>
            <text x="157.5" y="170" transform='rotate(-45, 157.5, 157.5)' className='small-name'>Max</text>
            <text x="202.5" y="155" transform='rotate(-45, 202.5, 157.5)' className='small-name'>Greg</text>
            <text x="202.5" y="170" transform='rotate(-45, 202.5, 157.5)' className='small-name'>Issac</text>

            

            <text x="0" y="70">10-11</text>
            <text x="0" y="115">11-12</text>
            <text x="0" y="160">12-1</text>
            <text x="0" y="205">1-2</text>
            <text x="0" y="250">2-3</text>
            <text x="0" y="295">3-4</text>
            <text x="0" y="340">4-5</text>
            <text x="0" y="385">5-6</text>

            <text x="45" y="25">Mon</text>
            <text x="90" y="25">Tue</text>
            <text x="135" y="25">Wed</text>
            <text x="180" y="25">Thu</text>
            <text x="225" y="25">Fri</text>

            <g fill='none' stroke='black'>
            <rect x='0' y='0' width='45' height='45'/>
            <rect x='0' y='45' width='45' height='45'/>
            <rect x='0' y='90' width='45' height='45'/>
            <rect x='0' y='135' width='45' height='45'/>
            <rect x='0' y='180' width='45' height='45'/>
            <rect x='0' y='225' width='45' height='45'/>
            <rect x='0' y='270' width='45' height='45'/>
            <rect x='0' y='315' width='45' height='45'/>
            <rect x='0' y='360' width='45' height='45'/>

            <rect x='45' y='0' width='45' height='45'/>
            <rect x='45' y='90' width='45' height='45'/>
            <rect x='45' y='135' width='45' height='45'/>
            <rect x='45' y='180' width='45' height='45'/>
            <rect x='45' y='225' width='45' height='45'/>
            <rect x='45' y='270' width='45' height='45'/>
            <rect x='45' y='315' width='45' height='45'/>
            <rect x='45' y='360' width='45' height='45'/>

            <rect x='90' y='0' width='45' height='45'/>
            <rect x='90' y='45' width='45' height='45'/>
            <rect x='90' y='90' width='45' height='45'/>
            <rect x='90' y='135' width='45' height='45'/>
            <rect x='90' y='180' width='45' height='45'/>
            <rect x='90' y='225' width='45' height='45'/>
            <rect x='90' y='270' width='45' height='45'/>
            <rect x='90' y='315' width='45' height='45'/>
            <rect x='90' y='360' width='45' height='45'/>

            <rect x='135' y='0' width='45' height='45'/>
            <rect x='135' y='45' width='45' height='45'/>
            <rect x='135' y='90' width='45' height='45'/>
            <rect x='135' y='135' width='45' height='45'/>
            <rect x='135' y='180' width='45' height='45'/>
            <rect x='135' y='225' width='45' height='45'/>
            <rect x='135' y='270' width='45' height='45'/>
            <rect x='135' y='315' width='45' height='45'/>
            <rect x='135' y='360' width='45' height='45'/>

            <rect x='180' y='0' width='45' height='45'/>
            <rect x='180' y='45' width='45' height='45'/>
            <rect x='180' y='90' width='45' height='45'/>
            <rect x='180' y='135' width='45' height='45'/>
            <rect x='180' y='180' width='45' height='45'/>
            <rect x='180' y='225' width='45' height='45'/>
            <rect x='180' y='270' width='45' height='45'/>
            <rect x='180' y='315' width='45' height='45'/>
            <rect x='180' y='360' width='45' height='45'/>

            <rect x='225' y='0' width='45' height='45'/>
            <rect x='225' y='45' width='45' height='45'/>
            <rect x='225' y='90' width='45' height='45'/>
            <rect x='225' y='135' width='45' height='45'/>
            <rect x='225' y='180' width='45' height='45'/>
            <rect x='225' y='225' width='45' height='45'/>
            <rect x='225' y='270' width='45' height='45'/>
            <rect x='225' y='315' width='45' height='45'/>
            <rect x='225' y='360' width='45' height='45'/>
            </g>
            </svg>
                {/* <p id='monday' className='border'>Mon</p>
                <p id='tuesday' className='border'>Tue</p>
                <p id='wednesday' className='border'>Wed</p>
                <p id='thursday' className='border'>Thu</p>
                <p id='friday' className='border'>Fri</p>
                <p id='ten' className='border'>10 - 11</p>
                <p id='eleven' className='border'>11 - 12</p>
                <p id='twelve' className='border'>12 - 1</p>
                <p id='one' className='border'>1 - 2</p>
                <p id='two' className='border'>2 - 3</p>
                <p id='three' className='border'>3 - 4</p>
                <p id='four' className='border'>4 - 5</p>
                <p id='five' className='border'>5 - 6</p>
<svg xmlns='http://www.w3.org/2000/svg' viewBox=' 10 10 220 220' fill="purple"> 
<rect cx='0' cy='0' width='100' height='100'/>
</svg>
                <p id='mon-10'>mon-10</p> */}
            </div>
        </div>
        </div>
    )
}


export default MentorGrid;