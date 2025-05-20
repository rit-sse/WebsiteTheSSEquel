# SSE Website Rebuild Vision & Scope Doc

Created: 04/18/2023 by Ryan (@2nPlusOne)

Revised: 05/19/2025 by Ryan (@2nPlusOne)

## Table of Contents

- [Project Overview](#project-overview)
- [Stakeholders](#stakeholders)
- [Problem Statement](#problem-statement)
- [Project Scope](#project-scope)
  - [MVP Features](#mvp-features)
    - [User Interface and Experience](#user-interface-and-experience)
    - [Site Navigation](#site-navigation)
    - [Homepage Features](#homepage-features)
    - [About Pages](#about-pages)
    - [Events Information](#events-information)
    - [Login and Authentication](#login-and-authentication)
    - [Go Links](#go-links)
    - [Officer Management](#officer-management)
  - [Nice-to-Have Features](#nice-to-have-features-enhancement)
  - [Project Boundaries](#project-boundaries)
  - [Project Exclusions](#project-exclusions)

## Project Overview

The [Society of Software Engineers](https://sse.rit.edu/) (SSE) at the [Rochester Institute of Technology](https://www.rit.edu/) (RIT) embarked on a project to rebuild their website using modern technologies, aesthetics, and industry best practices. Led by the Technology committee with support from the Projects committee, the website rebuild utilizes a modern tech stack using proven technologies with excellent documentation and resources. Our front-end and API layers is built using React, TypeScript, and the Next.js framework. The data layer will be accessed using the Prisma ORM, providing an API to the underlying PostgreSQL database.

The primary purpose of the project is to revitalize the Society's web infrastructure by creating a tailored system that meets the society's existing needs while providing clear, concise, accessible documentation and an extensible architecture. This approach will enable the site to adapt to the changing requirements of the society in the future and foster community engagement with its development. By making the project open-source, it will provide an avenue for new members to get involved with the Technology committee and contribute to the Society's growth.

The website rebuild has three main objectives:

1. Serve as a modernized and accessible hub for information about the SSE, including events, leadership, and projects.
2. Provide backend infrastructure to support the Society's data needs, managing memberships, leadership appointments, quotes, mentor data, mentor schedules, project data, and event data. 
3. Prioritize user experience, ensuring that information is easy to find and the site is intuitive to navigate.

## Stakeholders

| ID | Stakeholder Name | Role/Title | Interest in Project | Power | Communication Requirements | Engagement Strategy |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| S1 | Tess Hacker | Tech Head | Project leadership, quality | High | Weekly status updates | Leadership, close collaboration, technical support |
| S2 | Vacant | Tech Apprentice | Project leadership, learning | High | Weekly status updates | Mentoring, collaborative work |
| S3 | Student Tech Committee Members | Tech Committee Member | Technical input, collaboration, learning | Medium | Weekly Meetings | Inclusion in decision-making, code contribution |
| S4 | SSE Primary Officers | SSE Primary Officers | Project oversight, funding | High | Weekly progress reports | Regular meetings, updates |
| S5 | Projects Committee Head | Projects Head | Project success, coordination | High | Weekly status updates | Close collaboration, guidance |
| S6 | SSE Members | Members | Project awareness, source of SSE info | Low | As needed | Open communication, updates |
| S7 | Software Eng. Dept. Faculty | Faculty | Curriculum alignment, resources | Medium | Monthly progress reports  | Consultation, feedback |
| S8 | SSE Alumni | Alumni | Project support, mentoring | Low | Periodic updates | Consultation, code contribution |
| S9 | RIT Students | Prospective SSE Members | Project awareness, participation | Low | As needed | Open communication, presentations |
| S10 | Website Users | Members, Students, Alumni, Faculty, and anyone else | Ease of use, visually appealing, accessible, updated, relevant | Low | As needed | Feedback, user testing, suggestions, and feature requests |
| S11 | RIT GCCIS IT | IT Support | Infrastructure, technical support | Medium | As needed | Open communication, support |
| S12 | SSE Mentees | Mentees | Access to mentor schedules, easy navigation, relevant information | Low | As needed | Open communication, feedback, user testing |

## Problem Statement

Prior to this project, the SSE lacked an up-to-date, user-friendly, and accessible website that served as a comprehensive information hub for members, prospective members, faculty, and alumni. Additionally, the existing website didn't provide the necessary backend infrastructure and front-end user interfaces to manage the Society's data needs effectively, including membership management, event information, mentor schedules, project data, leadership details, and mentor profile data.

By addressing these issues, the new website will not only better serve the SSE's current needs but also enable it to grow and adapt to future challenges.

## Project Scope

### MVP Features

#### User Interface and Experience

- [ ] Responsive design that works on various devices and screen sizes.  
- [ ] Intuitive navigation and user-friendly layout.  
- [ ] Accessible design, adhering to web accessibility guidelines (WCAG compliance).

#### Site Navigation

- [x] Responsive navigation bar with the following main navigation items:
      - [x] ~~Home~~  
      - [x] ~~About (dropdown: About Us, Leadership, Constitution, Primary Officer's Policy, Committees, Historians)~~  
      - [ ] Mentoring  
      - [ ] Events (dropdown: View All, Spring Fling or Winter Ball, depending on the semester)  
      - [x] Projects  
      - [x] ~~Go Links. (dropdown: View All, and pinned Go Links)~~  
- [x] ~~For logged-out users, a Login button on the right side of the navigation bar.~~  
- [ ] For logged-in users, a profile icon with a dropdown menu of options including profile and logout.

#### Homepage Features

- [x] ~~Hero section/banner with a call to action (Slack link)~~  
- [x] ~~Weekly meeting time, lab location~~  
- [ ] Upcoming events highlights.  
- [ ] Recent project updates.

#### About Pages

- [x] ~~General SSE information on an About Us page.~~  
- [x] ~~Getting Involved page detailing ways a student can get involved with the organization.~~  
- [ ] Leadership Page  
      - [ ] Presenting current and past leadership details, including position, photo, one-sentence biographies, and social links.  
      - [ ] Officers separated into primary positions, and committee heads  
      - [ ] Scrollspy-esque with navlinks to previous year's officer positions and smooth scrolling  
- [x] Separate pages for the constitution and primary officer's policy
      - [ ] Scrollspy-esque navigation and smooth scrolling  
- [x] Committees page for information about each of the SSE's committees, and their purposes.  
- [ ] Historians page with photo galleries of past events. \[ENHANCEMENT\] (See Historians section below)

#### Events Information

- [x] ~~Page for embedded google calendar (linked on home page)~~  
- [ ] Pinned events (Spring Fling or Winter Ball) in the Events dropdown menu.

#### Login and Authentication

- [x] User login functionality using NextAuth (now Auth.js)  
- [x] Route guarding for pages visible only to certain roles (e.g. officer-only pages)

#### Go Links

- [x] Officer view of existing go links, with search functionality.  
- [x] Creating, editing, and deleting go links.

#### Officer Management

- [x] View for primary officers to view and edit officer appointments  
- [ ] Our faculty advisor (Marie) should have an admin role here as a back-up for reliable transfer of leadership

#### Quotes

- [ ] A dedicated page for quotes, accessible only via direct URL.  
- [ ] List of all quotes, with a search bar to search for specific quotes.  
- [ ] Button for users to submit a new quote for review by an officer before being added.  
- [ ] Logged-in officers can approve quote submissions and manage existing quotes.  
- [ ] Rotating carousel of ‘safe’ quotes on the homepage

#### Project Information

- [x] Projects page with info about SSE projects, and card listings of current projects with links to their details.  
- [x] Modal pop-up to view project details when clicking on a project card.
- [x] Officers (Projects Head) should be able to edit project descriptions.

#### Membership Management

- [ ] Officer view of membership data, including search, sorting, and filtering options.  
- [ ] Adding and editing memberships.  
- [ ] Users can view their own membership data on their profile page.

#### Mentor Management

- [ ] Mentor schedule management for Mentor Head.  
- [ ] Adding and removing mentors.  
- [ ] Public mentor schedule view and mentor details.  
- [ ] Mentor-specific information in user profiles, such as shift info and data on completed courses and skills.  
- [ ] Mentors should be able to select courses they’ve taken and their skills.  
- [ ] Search by course or skill, highlighting hour blocks that match the filter.

### Nice-to-Have Features [ENHANCEMENT]

#### User Profile

- [ ] Users should be able to view their profile.  
- [ ] User profiles, including personal information, membership data, and mentor-specific information.  
- [ ] Profiles should show information about the user’s name, profile picture, their memberships, and officer position.
- [ ] Projects the user is involved in would be nice to see here too.

#### Project Updates

Project updates serve to give each project a blogging platform to report on progress and keep stakeholders informed.  

- [ ] Dedicated page for each project, with title, project lead info, team members, and project description, as well as project updates.
- [ ] The projects head should be able to submit a project update which would be posted to the project's updates section (and saved to the database)  
- [ ] A project update should behave as a form with a title and body, and optionally a photo.
- [ ] Project stats from GitHub API (enhancement)
- [ ] Display recent project updates on the homepage [ENHANCEMENT]

#### Officer Dashboard

- [ ] For logged in officers, an Officer Dashboard navigation item in the navbar.  
- [ ] Authenticated access granted to officer roles only.  
- [ ] Centralized access to officer-only functionality (go links, mentor management, membership management, project management).

#### Credits Page

- [ ] A dedicated page for contributors to the website  
- [ ] Mentions name, semester active, role, and their specific contributions (which pages they contributed to/worked on)  
- [ ] Also links to User Profile

#### Historians Page (Photo Gallery)

- [ ] A dedicated page for photos of SSE events
- [ ] Organized by event (e.g. Spring Fling, Winter Ball, etc)
- [ ] Can tag photos in the database to provide search functionality (e.g. \#springfling, \#techcommittee, etc)  
- [ ] Can tag people in the photos\!

#### Company Outreach Page

- [ ] A dedicated page for company outreach information
- [ ] Information about the SSE's outreach efforts, including partnerships with companies and organizations.
- [ ] A list of companies that have partnered with the SSE, including their logos and links to their websites.
- [ ] Information about the benefits of partnering with the SSE, including access to a talented pool of students and opportunities for collaboration.
- [ ] A contact form for companies interested in partnering with the SSE, allowing them to reach out for more information or to express their interest.
- [ ] A section for testimonials from companies that have partnered with the SSE, highlighting their positive experiences and the value of the partnership.
- [ ] A section for upcoming outreach events, including dates, locations, and details about the events.
- [ ] A section for past outreach events, including photos and summaries of the events.

#### Advanced Events Page

- [ ] Display upcoming events on the homepage  
- [ ] Custom events display calendar using GCal API  
- [ ] Event registration and Google Calendar integrated event creation form.

#### Alumni Page

- [ ] A dedicated page for alumni of the SSE  
- [ ] Organized by graduating year  
- [ ] Each alumni listed can have a photo of choice, a quote, old roles and which year they fulfilled them, maybe a thing about what they’re up to now (like where they work)  
- [ ] Optional contact information for networking purposes  
- [ ] Alumni can *choose* to be on this page but are not added automatically

#### Coding Challenge Page

- [ ] A dedicated page for SSE coding challenges  
- [ ] Some place to submit solutions (copy paste, maybe choose which language they worked in via a dropdown like in Leetcode)  
- [ ] A place to see solutions  
- [ ] A place to see previous challenges  
- [ ] Connected to the user’s profile so their profile can show which coding challenges they completed

### Project Boundaries

- The project focuses on rebuilding the SSE website using the specified tech stack and implementing the features outlined in the high-level requirements section.  
- The project will include data migration from the existing platform to ensure a seamless transition and maintain data continuity.  
- The project will prioritize adherence to a predetermined timeline, ensuring that the project makes steady progress and is completed in the given timeframe.  
- The website is designed to provide information about the SSE organization, its events, projects, leadership, and memberships.  
- It also offers tools for managing mentor schedules, events, Go Links, quotes, leadership, and memberships.

### Project Exclusions

- Creation of promotional materials or marketing campaigns for the new SSE website.  
- Integration with third-party platforms or tools that are not explicitly mentioned in the high-level requirements section.  
- A custom-built forum for members, as the focus is on providing essential information and tools, rather than creating a social platform. That is for Slack/Discord.  
- An e-commerce platform for selling merchandise or accepting donations, as this is not part of the core objectives for the website.  
- Integration with third-party learning platforms or resources, as the focus is on providing information and tools specific to SSE and its members.

## Goals and Objectives

- Create a modernized, accessible, and easily navigable website for the Society of Software Engineers that serves as the central hub for information about the organization, its events, mentoring, leadership, and projects.

- Achieve at least 90% WCAG compliance for web accessibility, ensuring the new website offers an intuitive user experience and is easily navigable across various devices and screen sizes.

- Develop a robust backend infrastructure to support the Society's data needs, including membership management, leadership details, quotes database, alumni database, mentor details, mentor schedules, project data, and event data.

- Foster community engagement and involvement by making the project open-source, with a goal of having at least 10 SSE members contribute to the website's development during the project timeframe of August 2023 to December 2023\.

- Complete the website rebuild within the predetermined timeline of August 2023 to December 2023, adhering to the project scope and budget constraints, with regular milestone reviews every month.

- Ensure comprehensive documentation and an extensible architecture for the website, making it easier for future developers to maintain, update, and adapt the website to the changing requirements of the Society, while also promoting a culture of best-practices and knowledge sharing within the organization.

## Critical Success Factors

- Effective project management is essential as it aligns the project with its objectives, facilitating the team in achieving goals efficiently. An effective PM anticipates and proactively addresses potential issues, and ensures seamless communication between stakeholders.

- Effective communication and collaboration: Ensuring clear communication channels and utilizing collaboration tools to keep the team informed and aligned throughout the project.

- Weekly meetings: Holding regular team meetings to discuss progress, address issues, and keep the project on track.

- Use of GitHub Projects: Managing the project using a GitHub Projects board, with epics and stories created for each feature, to organize tasks and track progress effectively.

- Adherence to the project timeline: Regular progress updates and monitoring to ensure tasks are completed on time and potential delays are identified and addressed early on.

- Successful recruitment and involvement of at least 10 SSE members: Actively promoting the project within the Society and organizing workshops or introductory sessions to encourage member participation.

- Web accessibility compliance: Ensuring the website meets WCAG guidelines by engaging accessibility experts or incorporating accessibility testing into the development process.

- Responsive and user-friendly design: Conducting usability testing with real users and gathering feedback to continuously improve the website's user experience.

- Fulfilling functional requirements: Regularly reviewing and updating project requirements to ensure the website meets the Society's needs and expectations.

- Smooth data migration: Developing a well-defined data migration plan and conducting thorough testing to minimize the risk of data loss or corruption during the migration process.

- Comprehensive documentation and adherence to best practices: Establishing coding standards and documentation guidelines to facilitate future maintenance and extensibility of the website.

## Project Assumptions and Risks

### Assumptions

**Availability of sufficient resources:** The project assumes that there will be enough members interested in contributing to the project and that the required technology stack and infrastructure will be available.

**Familiarity with the technology stack:** The project assumes that the team members have the necessary skills or can quickly learn the chosen technology stack to effectively contribute to the project.

**Stable technology stack:** The project assumes that the chosen technology stack will remain stable and supported throughout the project's duration.

**Active involvement from stakeholders:** The project assumes that key stakeholders, such as the Society's leadership and committees, will actively participate in decision-making and provide timely feedback.

### Risks

**Not enough members:** There is a risk that not enough members will be interested in contributing to the project, which may impact the project timeline and scope.  
**Mitigation strategy:** Actively promote the project within the Society, provide training and workshops to help members get up to speed with the technology stack, and maintain clear communication channels to keep members engaged.

**Too many members:** The project may face challenges in coordinating contributions from a large number of members, leading to potential conflicts, miscommunication, and burnout.
**Mitigation strategy:** Establish a core team of dedicated members to lead the project, while also encouraging broader participation through well-defined roles and responsibilities. Maturing the open source process will help to mitigate this risk.

**Fluctuating academic workloads:** The fluctuating and demanding academic commitments of committee members may create challenges in maintaining consistent contributions to the project. This imbalance could lead to a slowing down of the development process and an increased risk of burnout, impacting the overall timeline and quality of the project.  
**Mitigation strategy:** Plan the project schedule with flexibility, taking into account key academic deadlines and commitments. Encourage open communication about workload changes and establish backup plans to accommodate fluctuations in availability. Collaboration with team members to prioritize tasks and leverage resources effectively can also help manage this risk.

**Scope creep:** The project may face scope creep, where additional features or requirements are added after the project has started, potentially leading to delays and increased complexity.  
**Mitigation strategy:** Establish a well-defined scope, conduct regular progress reviews, and ensure that any proposed changes to the scope are carefully evaluated and documented.

**Technical challenges:** The team may encounter technical challenges or roadblocks while working with the chosen technology stack, which could lead to delays or rework.  
**Mitigation strategy:** Conduct thorough research and planning before starting the project, provide training and resources to help team members learn the technology stack, and engage with the broader tech community for support and advice when needed.

**Data migration issues:** Data migration from the existing platform to the new system may result in data loss or corruption if not handled carefully.  
**Mitigation strategy:** Develop a well-defined data migration plan, conduct thorough testing, and involve experts in data migration to minimize the risk of data loss or corruption.

**Accessibility and usability issues:** The website may not meet accessibility and usability standards, which could limit its usefulness to the target audience.  
**Mitigation strategy:** Incorporate accessibility and usability testing into the development process, engage accessibility experts, and gather user feedback to continuously improve the website's design and user experience.

## Roadmap

This section outlines the high-level roadmap for the SSE website rebuild project, including key milestones and deliverables. The roadmap is divided into three phases: Planning, Development, and Deployment.

- **Phase 1: Planning (March 2023 - May 2023)**
  - Define project scope, objectives, and requirements.
  - Assemble the project team and assign roles.
  - Conduct research on the chosen technology stack and best practices.
  - Develop a project timeline with milestones and deadlines.
  - Create a project repository and set up version control using GitHub.
  - Organize training workshops for team members to familiarize them with the technology stack.
  - Organize brainstorming sessions to gather ideas and input from the team and stakeholders.

- **Phase 2: MVP Development & Deployment (August 2023 - March 2025)**
  - Implement the core features outlined in the MVP section.
  - Conduct regular progress reviews and adjust the project plan as needed.
  - Engage with stakeholders for feedback and input on the development process.
  - Perform testing and quality assurance to ensure functionality and usability.
  - Deploy the website to the production environment.
  - **Not all MVP features were completed in this phase, so the MVP was split into two phases.**

- **Phase 2.5: Continued MVP Development (April 2025 - Ongoing)**
  - Mature the open source process and onboarding process for new contributors.
    - Create a comprehensive documentation site for the project, including setup instructions, usage guidelines, and contribution guidelines.
    - Foster a small group of core contributors to garden the project -- responsible for backlog management and contribution support (especially PR reviews).
    - Create a clear and accessible process for new contributors to get involved, including guidelines for submitting issues, pull requests, and feature requests.
  - Continue to develop and implement the remaining MVP features.

- **Phase 4: Enhancement and Maintenance (Ongoing)**
  - Prioritize and implement nice-to-have features and enhancements.
  - Continue to engage with the community for ongoing contributions and support.
  - Regularly review and update documentation to reflect changes and improvements.
  - Monitor the website for performance, security, and accessibility issues, and address them as needed.
