import "./index.css";
import { Amplify } from "aws-amplify";
import amplifyconfig from "./amplifyconfiguration.json";

import { generateClient } from "aws-amplify/api";
import { createNewTodo, deleteTodo } from "./graphql/mutations";
import { listTodos } from "./graphql/queries";
import { onCreateTodo } from "./graphql/subscriptions";

import { useEffect, useState } from "react";

Amplify.configure(amplifyconfig);

const client = generateClient();

function App() {
  const [mutationResult, setMutationResult] = useState([]);
  const [queryResults, setQueryResults] = useState([]);
  // eslint-disable-next-line no-unused-vars
  
  const [newTodoName, setNewTodoName] = useState("");
  const [newTodoDescription, setNewTodoDescription] = useState("");
  const [subscriptionResults, setSubscriptionResults] = useState([]);
  
  useEffect(() => {
    const sub = client.graphql({ query: onCreateTodo }).subscribe({
      next: (event) => {
        const newTodo = event.data.onCreateTodo;
        setSubscriptionResults((prev) => [...prev, newTodo]);
      },  
      error: (error) => console.error("Subscription error:", error),
    });

    handleGetTodo();

    return () => {
      sub.unsubscribe();
    };
  }, []);

  async function handleGetTodo() {
    try {
      const response = await client.graphql({
        query: listTodos,
        variables: {
          limit: 10,
        },
      });

      setQueryResults(response?.data?.listTodos?.items || []);
    } catch (e) {
      console.log("Error!", e);
    }
  }

  async function handleAddTodo() {
    if (!newTodoName) {
      return;
    }

    const todo = {
      name: newTodoName,
      description: newTodoDescription,
    };

    try {
      const result = await client.graphql({
        query: createNewTodo,
        variables: {
          input: todo,
        },
      });

      const newTodo = result?.data?.createTodo;

      // Update local states
      setMutationResult((prev) => [newTodo, ...prev]);
      setQueryResults((prev) => [newTodo, ...prev]);
      setNewTodoName("");
      setNewTodoDescription("");
    } catch (e) {
      console.log("Error!", e);
    }
  }

  async function handleDeleteTodo(id) {
    try {
      await client.graphql({
        query: deleteTodo,
        variables: { input: { id } },
      });

      setQueryResults((prev) => prev.filter((todo) => todo.id !== id));
    } catch (e) {
      console.log("Error", e);
    }
  }

  return (
    <>
      <div className="app">
        <div className="app-header">
          <h1>TODO APP with Aplify + GraphQL</h1>
        </div>
        <div className="app-body">
          <div>
            <h2>Add a New Todo!</h2>
            <input
              type="text"
              placeholder="Enter name"
              value={newTodoName}
              onChange={(e) => setNewTodoName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Enter description (optional)"
              value={newTodoDescription}
              onChange={(e) => setNewTodoDescription(e.target.value)}
            />
            <button onClick={handleAddTodo}>Add Todo</button>
          </div>
          <hr />

          <div>
            <h2>Todo List Result</h2>
            <div>
              {mutationResult.map((todo, index) => (
                <div key={index}>
                  <p>
                    {index + 1} -{todo?.name} - {todo?.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <hr />

          <div>
            <h2> Db Fetch Result </h2>
            <div>
              {queryResults.map((todo, index) => (
                <div key={index}>
                  <p>
                    {" "}
                    {index + 1}- {todo?.name} - {todo?.description}
                  </p>
                  <button onClick={() => handleDeleteTodo(todo.id)}>Del</button>
                </div>
              ))}
            </div>
            <div id="SubscriptionResult">
              <h2>Subscription Results:</h2>
              {subscriptionResults.length > 0 ? (
                subscriptionResults.map((todo, index) => (
                  <p key={index}>
                    {todo?.name} - {todo?.description || "No description"}
                  </p>
                ))
              ) : (
                <p>No new subscription data yet...</p>
              )}
            </div>
          </div>
          <hr />
        </div>
      </div>
    </>
  );
}

export default App;