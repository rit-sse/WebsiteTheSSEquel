// TO-DO: Edit this page for making a new Alumni (It is NOT close to working)

import { useSession } from "next-auth/react";
import { use, useCallback, useEffect, useState } from "react";
import { CreateAlumniProps } from "./page";
import { deepEqual, equal, notDeepEqual } from "assert";

export const CreateAlumniButton: React.FC<CreateAlumniProps> = ({ fetchData }) => {
  const { data: session }: any = useSession();
  const [alumni_id, setAlumniID] = useState("");
  const [user_id, setUserID] = useState("");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [quote, setQuote] = useState("");
  const [previous_roles, setPreviousRoles] = useState("");
  const [description, setDescription] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [email, setEmail] = useState("");
  const [start_date, setStartDate] = useState("");
  const [end_date, setEndDate] = useState("");

  const [formData, setFormData] = useState({
    alumni_id: '',
    user_id: '',
    name: '',
    title: '',
    quote: '',
    previous_roles: '',
    desc: '',
    linkedin: '',
    github: '',
		user_email: '',
		start_date: '',
		end_date: '',
	});
	const [error, setError] = useState("")

	// Clear form if closed
	useEffect(() => {
		if (!open) {
			clearForm();
		}
	}, [open])

	const clearForm = () => {
		setFormData({
      alumni_id: '',
      user_id: '',
      name: '',
      title: '',
      quote: '',
      previous_roles: '',
      desc: '',
      linkedin: '',
      github: '',
      user_email: '',
      start_date: '',
      end_date: '',
		});
	}

  const handleSetTitle = (givenTitle: string) => {    
      setTitle(givenTitle);
  };

  const handleCancel = () => {
    setTitle("");
    setDescription("");
  };

  const handleCreate = async () => {
    try {
      const response = await fetch("/api/alumni", {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: alumni_id,
            start_date: start_date,
            end_date: end_date
        })
      });

      if (response.ok) {
        handleCancel();
        //(document.getElementById("create-golink") as HTMLDialogElement).close();
        fetchData();
      }
    } catch (error) {}
  };

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
                document.getElementById("create-golink") as HTMLFormElement
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

        <dialog id="create-golink" className="modal">
          <div className="modal-box">
            <h3 className="font-bold py-4 text-xlg">Create Alumni</h3>

            <label className="my-2 input input-bordered flex items-center gap-2">
              Alumni Title:
              <input
                type="text"
                className="grow text-gray-900"
                placeholder="The SSE Website"
                value={title}
                onChange={((e) => handleSetTitle(e.target.value))}
              />
            </label>

            <textarea
              className="textarea textarea-bordered w-full"
              placeholder="Description (keep it short please)"
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
                          "create-golink"
                        ) as HTMLDialogElement
                      ).close();
                    }}
                  >
                    Cancel
                  </button>
                </form>
              </div>
            </div>
          </div>
        </dialog>
      </>
    );
  }
};

export default CreateAlumniButton;
