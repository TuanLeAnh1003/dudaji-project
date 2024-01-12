import { Button, Input, Modal } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";
import * as process from "process";

window.global = window;
window.process = process;
window.Buffer = [];

const socket = io(
  process.env.REACT_APP_SOCKET_URL ?? "http://localhost:8080"
);
const Dashboard = () => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user:detail"))
  );
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState();
  const [caller, setCaller] = useState();
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState();
  const [callEnded, setCallEnded] = useState();
  const [me, setMe] = useState("");
  const [name, setName] = useState("");
  const [openCallModal, setOpenCallModal] = useState(false);

  const messageRef = useRef(null);
  const videoRef = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  const BACK_END_URL =
    process.env.REACT_APP_BACK_END_URL ?? "http://localhost:8000";

  useEffect(() => {
    socket?.emit("addUser", user?.id);
    // socket?.on("getUsers", (users) => {
    // });
    socket?.on("getMessage", (data) => {
      setMessages((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          { user: data.user, message: data.message },
        ],
      }));
    });
  }, []);

  useEffect(() => {
    messageRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.messages]);

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("user:detail"));
    const fetchConversations = async () => {
      const res = await fetch(
        `${BACK_END_URL}/api/conversations/${loggedInUser?.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const resData = await res.json();
      setConversations(resData);
    };
    fetchConversations();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch(`${BACK_END_URL}/api/users/${user?.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const resData = await res.json();
      setUsers(resData);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          setStream(stream);
        }).catch(err => {
          console.log(err);
        });

    socket.on("me", (id) => {
      setMe(id);
    });
    socket.on("callUser", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setName(data.name);
      setCallerSignal(data.signal);
    });
  }, []);

  useEffect(() => {
    if(stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, videoRef.current])

  const fetchMessages = async (conversationId, receiver) => {
    const res = await fetch(
      `${BACK_END_URL}/api/message/${conversationId}?senderId=${user?.id}&&receiverId=${receiver?.receiverId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const resData = await res.json();
    setMessages({ messages: resData, receiver, conversationId });
  };

  const sendMessage = async (e) => {
    setMessage("");
    socket?.emit("sendMessage", {
      senderId: user?.id,
      receiverId: messages?.receiver?.receiverId,
      message,
      conversationId: messages?.conversationId,
    });
    const res = await fetch(`${BACK_END_URL}/api/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversationId: messages?.conversationId,
        senderId: user?.id,
        message,
        receiverId: messages?.receiver?.receiverId,
      }),
    });
  };

  const callUser = (id) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: me,
        name: user.fullName,
      });
    });

    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream
  })

    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal)
    });

    connectionRef.current = peer;
  };

  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: caller });
    });
    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream;
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
    connectionRef.current.destroy();
    setOpenCallModal(false);
  };

  const handleClickCall = (id) => {
    setOpenCallModal(true);
    callUser(id);
  };

  return (
    <div className="w-screen flex">
      <div className="w-[25%] h-screen bg-secondary overflow-scroll">
        <div className="flex items-center my-8 mx-14">
          <img
            className="w-12 h-12 rounded-full"
            src={user?.avatarUrl}
            alt="avatar"
          />
          <div className="ml-8">
            <h3 className="text-2xl">{user?.fullName}</h3>
            <p className="text-lg font-light">My Account</p>
          </div>
        </div>
        <hr />
        <div className="mx-14 mt-10">
          <div className="text-primary text-lg">Messages</div>
          <div>
            {conversations.length > 0 ? (
              conversations.map(({ conversationId, user }) => {
                return (
                  <div className="flex items-center py-8 border-b border-b-gray-300">
                    <div
                      className="cursor-pointer flex items-center"
                      onClick={() => fetchMessages(conversationId, user)}
                    >
                      <div>
                        <img
                          src={user?.avatarUrl}
                          className="w-[60px] h-[60px] rounded-full p-[2px] border border-primary"
                        />
                      </div>
                      <div className="ml-6">
                        <h3 className="text-lg font-semibold">
                          {user?.fullName}
                        </h3>
                        <p className="text-sm font-light text-gray-600">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-lg font-semibold mt-24">
                No Conversations
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="w-[50%] h-screen bg-white flex flex-col items-center">
        {messages?.receiver?.fullName && (
          <div className="w-[75%] bg-secondary h-[80px] my-6 rounded-full flex items-center px-14 py-2">
            <div className="cursor-pointer">
              <img
                src={user?.avatarUrl}
                className="w-[60px] h-[60px] rounded-full p-[2px] border border-primary"
              />
            </div>
            <div className="ml-6 mr-auto">
              <h3 className="text-lg">{messages?.receiver?.fullName}</h3>
              <p className="text-sm font-light text-gray-600">
                {messages?.receiver?.email}
              </p>
            </div>
            <div
              className="cursor-pointer"
              onClick={() => handleClickCall(messages?.receiver?.receiverId)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="black"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" />
                <line x1="15" y1="9" x2="20" y2="4" />
                <polyline points="16 4 20 4 20 8" />
              </svg>
            </div>
          </div>
        )}
        <div className="h-[75%] w-full overflow-scroll shadow-sm">
          <div className="p-14">
            {messages?.messages?.length > 0 ? (
              messages.messages.map(({ message, user: { id } = {} }) => {
                return (
                  <div className="flex items-center">
                    {id !== user?.id && (
                      <img
                        src={user?.avatarUrl}
                        className="mr-3 w-[60px] h-[60px] rounded-full p-[2px] border border-primary"
                      />
                    )}
                    <div
                      className={`max-w-[40%] rounded-b-xl p-4 mb-6 ${
                        id === user?.id
                          ? "bg-primary rounded-tl-xl ml-auto text-white"
                          : "bg-secondary rounded-tr-xl"
                      } `}
                      style={{
                        color: id === user?.id ? "white" : "black",
                      }}
                    >
                      {message}
                    </div>
                    <div ref={messageRef}></div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-lg font-semibold mt-24">
                No Messages or No Conversation Selected
              </div>
            )}
          </div>
        </div>
        {messages?.receiver?.fullName && (
          <div className="p-6 w-full flex items-center">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-[75%]"
              inputClassName="p-4 border-0 shadow-md rounded-full bg-light focus:ring-0 focus:border-0 outline-none"
            />
            <div
              className={`ml-4 p-2 cursor-pointer bg-light rounded-full ${
                !message && "pointer-events-none"
              }`}
              onClick={() => sendMessage()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="icon icon-tabler icon-tabler-send"
                width="30"
                height="30"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="#2c3e50"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <line x1="10" y1="14" x2="21" y2="3" />
                <path d="M21 3l-6.5 18a0.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a0.55 .55 0 0 1 0 -1l18 -6.5" />
              </svg>
            </div>
            <div
              className={`ml-4 p-2 cursor-pointer bg-light rounded-full ${
                !message && "pointer-events-none"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="icon icon-tabler icon-tabler-circle-plus"
                width="30"
                height="30"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="#2c3e50"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <circle cx="12" cy="12" r="9" />
                <line x1="9" y1="12" x2="15" y2="12" />
                <line x1="12" y1="9" x2="12" y2="15" />
              </svg>
            </div>
          </div>
        )}
      </div>
      <div className="w-[25%] h-screen bg-light px-8 py-16 overflow-scroll">
        <div className="text-primary text-lg">People</div>
        <div>
          {users.length > 0 ? (
            users.reverse().map(({ userId, user }) => {
              return (
                <div className="flex items-center py-8 border-b border-b-gray-300" key={userId}>
                  <div
                    className="cursor-pointer flex items-center"
                    onClick={() => fetchMessages("new", user)}
                  >
                    <div>
                      <img
                        src={user?.avatarUrl}
                        className="w-[60px] h-[60px] rounded-full p-[2px] border border-primary"
                      />
                    </div>
                    <div className="ml-6">
                      <h3 className="text-lg font-semibold">
                        {user?.fullName}
                      </h3>
                      <p className="text-sm font-light text-gray-600">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-lg font-semibold mt-24">
              No Conversations
            </div>
          )}
        </div>
      </div>

      <Modal
        open={openCallModal || receivingCall}
        onCancel={() => {
          setOpenCallModal(false);
          setCallEnded(true);
        }}
        footer={false}
      >
        <div className="container">
          <div className="video-container">
            <div className="video">
              <video
                playsInline
                muted
                ref={videoRef}
                autoPlay
                style={{ width: "300px" }}
              />
            </div>
            <div className="video">
              <video
                playsInline
                ref={userVideo}
                autoPlay
                style={{ width: "300px" }}
              />
            </div>
          </div>
          <div className="myId">
            <div className="call-button">
              {callAccepted && !callEnded && (
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={leaveCall}
                >
                  End Call
                </Button>
              )}
            </div>
          </div>
          <div>
            {receivingCall && !callAccepted ? (
              <div className="caller">
                <h1>{name} is calling...</h1>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={answerCall}
                >
                  Answer
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
