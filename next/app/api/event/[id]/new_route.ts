
// Gets data from the google calendar api 

import { GET } from "../route"

export async function GET_DATA_API(){
     try {
          
           const calendarId = "630263868663-38ivpl85ffm2p32gbn1fmr26hdtg2j03.apps.googleusercontent.com"
          const api_key = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC2rKogxzutpAXz\npmbnggsgg3JVNIDjT3bZ/uJbAKacrp2KRqHNzEnRchQxySU9Kn68krbV9XhbDzn2\nY0Zk+ZaNko5cUYasK69pdSfSNHSrwf/YQpvQCoH0B6jq07pOyvcA0cL8eyzJ3bH/\np/mO7KuseBy2q93mAUpzeHEKw8IIdGUDPZtfnNi5as3QxH+irPC818C6xF6/cc7i\nlIvPnNwtrh8NqF6XmsnmHPAam6EDQLEV06Q/hgrpTPZl3ZitOrr8YMDZZIC0khBv\nY/z+jqdLvCMgvlkTxzhQ2CagZ5y6YWaqTN+ljpRl1QyRGygujICIC7hHRCw3meE3\nqlJo4EeZAgMBAAECggEAG4Y9NSan6pQ4FFwKjc/1or7Dk6yPThDLYPHrg9g/goS5\n9puJZkOljMIyYkUDUCnOwlWd6HOt4JSVAHe5Y94Kjgba3fSnxNnpOovdRepC+R1I\nUjrJFOn8ZjtgO4/O9u/Uk2JHzbi2iS0XFKUn8F3fSSOo+epAC1e+8tKfP8a6vgCf\n3DwMWG/JiYxQTjic9NGtoQ48I+l1j8hhD8AhVBt155KH5V8cVPnev5i9kDXZ/n9z\n6I0MbGk8jO5KX43yQqQT9FyATQjt2wOFUJJfcETV1oVGyfLA28L0ZEcHV6aqqxkB\np66wvEQRRyFsKlQHHyeY+J7Gl6DdA6+W7zldjXR5rQKBgQD5+Zlpt6MsVHg8nLRJ\nVz20VjBRussTxwFF5ef+MBns/P3hVxUZ2q7O/mwHXnjZffOQ0SNXxV+9ZxJhoGhS\nJa/FmRCuM5z9gcQ/XjyCzFaR2U7fCo57Q3op8VyYOSkOJwCLGhh+rSnXMZ6XhhXj\nCX3wZoqtm6hfszXW8qP74usRBQKBgQC7E85ltp6K0dJ7kXwwvE6kuPFNDDUqqXl2\ntpTlFj7gDJ9Tdca68icnZjDh3brhfPsW+WXgRLpE3xa50l3nF4UViUE2ujO5nas3\n1i1Xr8w4pLy66ciJHFzJ2RP75EJxn7hwD8VpA7pLw+h+cnzREzpcCuDcQTBWWDZe\n4TadlmmwhQKBgQDEwit4I/yDCyXtB6d8xveht+mmmzH3qj+dRh66XCA8AtLPCR1p\n0VChS2+6ySi0gMgzp/p6vrfiPHwibgFPD6zwCtAvXh7nB7px6noUtkQ53uOO+h82\ndOF2nC22/98J7bcmxm6bXy+826iqOfeGUlVX4U6s4gXA9i2duDVNMcq3BQKBgBzt\nhR7pTD6/D0MYThHjLG4AQx/c4WPFbQjUVtXNyM8wZHqtXZuO0ksfXDOw67Ludo0o\n5330YrE/pe35/5c6ZdPcs37Y8CKlpNIvhjdm8bdYke59NAsvnZGAxbxPoY6cWhLJ\n/YatkuMgWhUjcvWJeZ699+NXGThgz5eAT8eyeIlZAoGBAN82bl2AaCYC4jQ8uAFR\nnLnY7pb4KHY+YQGQQq/0B/fUX+n7ARq5VWcjahWE65odQaJaMrSFIUp6pOrq8RFd\nSxXPZH11aOSgfktYnPW0PDjrI+m6pIIbLL79LTuC+i9oNt+oAvMmn8IG2xyW4V+P\n4jWpr1J+JFCns+UteSEHqHMr\n-----END PRIVATE KEY-----\n,"
          //const api_key = "AIzaSyB8RfW00Roz0jfPABLh0f_Dumdv5X4BG_Y"
          const timeMin = new Date().toISOString(); // fetch only upcoming events
          
          const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${api_key}&timeMin=${timeMin}&singleEvents=true&orderBy=startTime`;
          //https://www.googleapis.com/calendar/v3/calendars/630263868663-38ivpl85ffm2p32gbn1fmr26hdtg2j03.apps.googleusercontent.com/events?key=AIzaSyB8RfW00Roz0jfPABLh0f_Dumdv5X4BG_Y    
          //https://www.googleapis.com/calendar/v3/calendars/630263868663-38ivpl85ffm2p32gbn1fmr26hdtg2j03.apps.googleusercontent.com
          const new_url = `https://www.googleapis.com/calendar/v3/calendars/630263868663-38ivpl85ffm2p32gbn1fmr26hdtg2j03.apps.googleusercontent.com` 
          const res = await fetch(new_url);
          return res
     } catch (error) {


          return "IT DIDN't WORK"
     }
}