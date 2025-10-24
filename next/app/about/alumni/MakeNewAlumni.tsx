// TO-DO: Edit this page for making a new Alumni (It is NOT close to working)

import { useEffect, useState } from "react";

interface CreateAlumniProps {
  fetchData: () => Promise<void>;
}

export const CreateAlumniButton: React.FC<CreateAlumniProps> = ({ fetchData }) => {
  // const { data: session }: any = useSession();
  // const [alumni_id, setAlumniID] = useState("");
  // const [user_id, setUserID] = useState("");
  const [name, setName] = useState("");
  const [quote, setQuote] = useState("");
  const [previous_roles, setPreviousRoles] = useState("");
  const [description, setDescription] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [email, setEmail] = useState("");
  const [start_date, setStartDate] = useState("");
  const [end_date, setEndDate] = useState("");
  const [image, setImage] = useState("");
  

  // Handle setting the variables
  const handleSetName = (givenName: string) => {    
      setName(givenName);
  };

  const handleSetQuote = (givenQuote: string) => {    
      setQuote(givenQuote);
  };

  const handleSetPreviousRoles = (givenPreviousRoles: string) => {    
      setPreviousRoles(givenPreviousRoles);
  };

  const handleSetDescription = (givenDescription: string) => {    
      setDescription(givenDescription);
  };

  const handleSetLinkedin = (givenLinkedin: string) => {    
      setLinkedin(givenLinkedin);
  };

  const handleSetGithub = (givenGithub: string) => {    
      setGithub(givenGithub);
  };

  const handleSetEmail = (givenEmail: string) => {    
      setEmail(givenEmail);
  };

  const handleSetStartDate = (givenStartDate: string) => {    
      setStartDate(givenStartDate);
  };

  const handleSetEndDate = (givenEndDate: string) => {    
      setEndDate(givenEndDate);
  };

  const handleSetImage = (givenImage: string) => {
      setImage(givenImage);
  }

  const handleCancel = () => {
    setName("");
    setQuote("");
    setPreviousRoles("");
    setDescription("");
    setLinkedin("");
    setGithub("");
    setEmail("");
    setStartDate("");
    setEndDate("");
  };

  const handleCreate = async () => {
    try {

      const response = await fetch("/api/alumni", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: name,
            email: email,
            linkedIn: linkedin,
            gitHub: github,
            description: description,
            quote: quote,
            previous_roles: previous_roles,
            start_date: start_date,
            end_date: end_date,
            image: image
        })
      });

      if (response.ok) {
        handleCancel();
        (document.getElementById("create-alumni") as HTMLDialogElement).close();
        fetchData();
      }
    } catch (error) {}
  };

  // Input Form shown if the current user is an Officer
  const [isOfficer, setIsOfficer] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await fetch("/api/authLevel").then((response) =>
        response.json()
      );
      console.log(data);
      setIsOfficer(data.isOfficer);
    })();
  }, []);

  if (isOfficer) {
    return (
      <>
        <button
          onClick={(func) => {
            func.preventDefault();
            if (document) {
              (
                document.getElementById("create-alumni") as HTMLFormElement
              ).showModal();
            }
          }}
          className="
                p-4
                h-full
                bg-base-100
                rounded-md
                shadow-md
                justify-items-center
                hover:shadow-lg
                transition-shadow
                border-2
                border-base-content
                hover:border-info
                text-xl"
        >
          Create Alumni
        </button>

        <dialog id="create-alumni" className="modal overflow-scroll">
          <form onSubmit={handleCreate} className="modal-box">
            <h3 className="font-bold py-4 text-xlg">Create Alumni</h3>

            <label className="my-2 input input-bordered flex items-center gap-2">
              Alumni Name:
              <input
                type="text"
                className="w-full text-gray-900"
                placeholder="Name (required)..."
                value={name}
                onChange={((e) => handleSetName(e.target.value))}
                required
              />
            </label>
            <label className="my-2 input input-bordered flex items-center gap-2">
              Email:
              <input
                type="email"
                className="w-full text-gray-900"
                placeholder="Email (required)..."
                value={email}
                onChange={((e) => handleSetEmail(e.target.value))}
                required
              />
            </label>
            <label className="my-2 input input-bordered flex items-center gap-2">
              Start Date:
              <input
                type="text"
                className="w-full text-gray-900"
                placeholder="(required) (ex: Fall 2023)..."
                value={start_date}
                onChange={((e) => handleSetStartDate(e.target.value))}
                required
              />
            </label>
            <label className="my-2 input input-bordered flex items-center gap-2">
              Graduation Date:
              <input
                type="text"
                className="w-full text-gray-900"
                placeholder="(required) (ex: Spring 2024)..."
                value={end_date}
                onChange={((e) => handleSetEndDate(e.target.value))}
                required
              />
            </label>
            <label className="my-2 input input-bordered flex items-center gap-2">
              Image:
              <input
                type="text"
                className="w-full text-gray-900"
                placeholder="Image link (send entire web link)..."
                value={image}
                onChange={((e) => handleSetImage(e.target.value))}
                required
              />
            </label>
            <label className="my-2 input input-bordered flex items-center gap-2">
              Quote:
              <input
                type="text"
                className="w-full text-gray-900"
                placeholder="Quote..."
                value={quote}
                onChange={((e) => handleSetQuote(e.target.value))}
              />
            </label>
            <label className="my-2 input input-bordered flex items-center gap-2">
              Previous Roles:
              <input
                type="text"
                className="w-full text-gray-900"
                placeholder="Previous Roles..."
                value={previous_roles}
                onChange={((e) => handleSetPreviousRoles(e.target.value))}
              />
            </label>
            <label className="my-2 input input-bordered flex items-center gap-2">
              LinkedIn:
              <input
                type="text"
                className="w-full text-gray-900"
                placeholder="LinkedIn..."
                value={linkedin}
                onChange={((e) => handleSetLinkedin(e.target.value))}
              />
            </label>
            <label className="my-2 input input-bordered flex items-center gap-2">
              GitHub:
              <input
                type="text"
                className="w-full text-gray-900"
                placeholder="GitHub..."
                value={github}
                onChange={((e) => handleSetGithub(e.target.value))}
              />
            </label>
            <textarea
              className="textarea textarea-bordered w-full"
              placeholder="Description (keep it short please)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>

            <div className="flex">
              <span className="flex-grow"></span>

              <div className="modal-action">
                <form method="dialog">
                  <button
                    className="btn"
                    onClick={() => {
                      handleCreate();
                      // In handleCreate, if it goes well it will close the Modal.
                    }}
                  >
                    Create
                  </button>
                </form>
              </div>

              <span className="w-2"></span>

              <div className="modal-action">
                <form method="dialog">
                  <button
                    className="btn"
                    onClick={() => {
                      handleCancel();
                      (
                        document.getElementById(
                          "create-alumni"
                        ) as HTMLDialogElement
                      ).close();
                    }}
                  >
                    Cancel
                  </button>
                </form>
              </div>
            </div>
          </form>
        </dialog>
      </>
    );
  }
};

export default CreateAlumniButton;
