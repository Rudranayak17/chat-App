import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Container,
  HStack,
  Input,
  VStack,
} from "@chakra-ui/react";
import Message from "./components/Message";
import {
  onAuthStateChanged,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { app } from "./firebase";
import {
  getFirestore,
  addDoc,
  collection,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

const auth = getAuth(app);
const db = getFirestore(app);

const loginHandler = () => {
  const provider = new GoogleAuthProvider();

  signInWithPopup(auth, provider);
};
const logoutHandler = () => {
  signOut(auth);
};

function App() {

  const [user, setUser] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const divForScroll=useRef(null)

  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, "Messages"), {
        text: message,
        uid: user.uid,
        uri: user.photoURL,
        createdAt: serverTimestamp(),
      });
      setMessage("");
      divForScroll.current.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      alert(error);
    }
  };

  useEffect(() => {
    const q=query(collection(db,'Messages'),orderBy('createdAt','asc'))
    const unsubscribe = onAuthStateChanged(auth, (data) => {
      setUser(data);
    });
    const unsubscribeForMessage =onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((item) => {
          const id = item.id;
          return { id, ...item.data() };
        })
      );
    });
    return () => {
      unsubscribe();
      unsubscribeForMessage();
    };
  }, []);
  return (
    <Box bg={"red.50"}>
      {user ? (
        <Container bg={"white"} h={"100vh"}>
          <VStack h={"full"} p={"4"}>
            <Button
              onClick={logoutHandler}
              width={"full"}
              colorScheme="red"
              textColor={"black"}
            >
              Logout
            </Button>
            <VStack css={{'&::-webkit-scrollbar':{
              display:"none"
            }}} color={"black"} h={"full"} overflowY={"auto"} w={"full"}>
              {messages.map((item) => (
                <Message
                  user={item.uid === user.uid ? "me" : "other"}
                  key={item.id}
                  text={item.text}
                  uri={item.uri}
                />
              ))}
            </VStack>
            <div ref={divForScroll}></div>
            <form onSubmit={submitHandler} style={{ width: "100%" }}>
              <HStack>
                <Input
                required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  color={"black"}
                  type="text"
                  placeholder="Enter a Message"
                  _placeholder={{ opacity: 0.4, color: "black" }}
                />
                <Button colorScheme="purple" type="submit">
                  Send
                </Button>
              </HStack>
            </form>
          </VStack>
        </Container>
      ) : (
        <VStack justify={"center"} h={"100vh"}>
          <Button
            onClick={loginHandler}
            colorScheme="purple"
            bgColor={"twitter.100"}
            color={"black"}
          >
            Sign In with Google
          </Button>
        </VStack>
      )}
    </Box>
  );
}

export default App;
