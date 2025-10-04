# SpendWise - AI-Powered Expense Management

SpendWise is a comprehensive, front-end demo application for expense management. It leverages the Google Gemini API for intelligent receipt scanning and features role-based access for employees, managers, and administrators.

**Key Characteristic:** All application data (users, expenses, companies, etc.) is stored exclusively in your browser's **local storage**. This makes it a perfect, self-contained demo that runs without a backend server.

---

## ✨ Key Features

### For Employees
- **🤖 AI Receipt Scanning:** Upload a receipt image and let the Gemini AI automatically extract the total amount, date, merchant, and category.
- **📝 Easy Expense Submission:** Manually create and submit detailed expense reports.
- **📊 Personal Dashboard:** Get a quick overview of your pending and approved expenses.
- **💬 Internal Chat:** Communicate with team members, managers, or the entire company in dedicated channels.
- **📜 Expense History:** View the status and approval history of all your submissions.
- **👤 Editable Profile:** Manage your personal details, work experience, and connect with colleagues.

### For Managers & Approvers
- **✅ Approval Workflow:** Review, approve, or reject expense submissions from your team members with optional comments.
- **📈 Team Expense Tracking:** Monitor your team's spending with powerful filtering and search capabilities.
- **💰 Currency Conversion:** View expense amounts in your company's base currency, with automatic conversion for foreign transactions.

### For Admins
- **⚙️ Dynamic Workflow Editor:** Create and manage multi-level approval workflows. Define steps, assign approvers (by role or specific user), and set completion conditions (e.g., "any one approver" or "all approvers").
- **🏢 Company-Wide Oversight:** Access a comprehensive view of all expenses across the entire organization.
- **👥 User Management:** Easily add, edit, and manage all user accounts, roles, and reporting structures.
- **🤝 Company Directory:** View a searchable directory of all employees in the company.

---

## 🛠️ Tech Stack

| Category        | Technology                                                                          |
| --------------- | ----------------------------------------------------------------------------------- |
| **Frontend**    | [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)           |
| **AI**          | [Google Gemini API](https://ai.google.dev/) (`gemini-2.5-flash`)                   |
| **Styling**     | [Tailwind CSS](https://tailwindcss.com/)                                            |
| **Routing**     | [React Router](https://reactrouter.com/)                                            |
| **Icons**       | [Lucide React](https://lucide.dev/)                                                 |
| **Data Storage**| Browser Local Storage                                                               |
| **Tooling**     | This project runs directly in the browser using an `importmap` for dependencies.    |

---

## 🚀 Getting Started

This project is designed to run directly in the browser without a build step.

### Prerequisites
- A modern web browser (like Chrome, Firefox, or Edge).
- A Google Gemini API Key.

### How to Run
1.  **Download/Clone:** Get the project files onto your local machine.
2.  **Get a Gemini API Key:**
    -   Visit [Google AI Studio](https://aistudio.google.com/app/apikey) to generate your free API key.
3.  **Launch the Application:**
    -   The simplest way to run this is to use a live server extension in your code editor (like VS Code's "Live Server").
    -   Right-click on the `index.html` file and open it with your live server.
4.  **Add Your API Key:**
    -   Once the application is running, you will see a "Sign Up" screen. Create your company and admin user.
    -   After logging in, you'll see a **"Gemini API Key" input field** at the bottom of the left-hand sidebar.
    -   Paste your API key there. It will be saved to your browser's local storage for future use.

The "AI Scan" feature on the "New Expense" page will now be enabled.

---

## ⚙️ How It Works

This application is designed as a **backend-less, client-side-only demo**.

-   **Local Storage Database:** All data is managed through React Context and stored in `localStorage`. When you create users, submit expenses, or build workflows, you are writing to your browser's storage. This data persists between sessions but will be lost if you clear your browser data.

-   **AI-Powered Scanning:** When a receipt is uploaded on the "New Expense" page, the image is converted to a base64 string and sent to the Google Gemini API along with a structured prompt. The model analyzes the image and returns a JSON object with the extracted expense details, which then pre-fills the form.

-   **Dynamic Workflows:** The admin-defined workflows dictate the approval chain. When an expense is submitted, the system identifies the first step's approvers based on the rules (e.g., the employee's direct manager). Upon approval, it checks the step's completion condition and either moves to the next step or finalizes the approval.
