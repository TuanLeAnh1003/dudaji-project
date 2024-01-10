import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button, Form, notification, message } from "antd";
import "../App.css";
import {
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faUser,
  faImage,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { login, register } from "../apis/auth";

const LoginSignupForm = ({ isLogin = true }) => {
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();
  const [loading, setLoading] = useState(false);

  const handleShowPasswordIcon = (visible) =>
    visible ? (
      <FontAwesomeIcon icon={faEye} className="cursor-pointer" />
    ) : (
      <FontAwesomeIcon icon={faEyeSlash} className="cursor-pointer" />
    );

  const handleSubmit = (values) => {
    setLoading(true);
    if (isLogin) {
      login(values)
        .then(async (res) => {
          if (res.status === 200) {
            message.success("Login successfully!");
            const data = await res.json();
            localStorage.setItem("user:token", data.token);
            localStorage.setItem("user:detail", JSON.stringify(data.user));
            navigate("/");
          }
        })
        .catch(() => {
          message.error("Error: Can not login");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      register(values)
        .then(async (res) => {
          if (res.status === 200) {
            message.success("Register successfully!");
            navigate("/login");
          }
        })
        .catch(() => {
          message.error("Error: Can not register");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  return (
    <div className="bg-light h-screen flex items-center justify-center">
      {contextHolder}
      <div className="bg-white w-[600px] py-5 shadow-lg rounded-lg flex flex-col justify-center items-center">
        <div className="text-4xl font-extrabold">
          Welcome {isLogin && "Back"}
        </div>
        <div className="text-xl font-light mb-14">
          {isLogin ? "Sign in to get explored" : "Sign up to get started"}
        </div>
        <Form
          className="w-[80%]"
          name="formLoginSignup"
          layout={"vertical"}
          initialValues={{ remember: true }}
          onFinish={handleSubmit}
          autoComplete="off"
        >
          {!isLogin && (
            <>
              <Form.Item
                label="Fullname"
                className="w-full"
                name="fullName"
                rules={[
                  {
                    required: true,
                    message: "Fullname is required!",
                  },
                ]}
              >
                <Input
                  prefix={<FontAwesomeIcon icon={faUser} className="mr-2" />}
                  placeholder="Input fullname..."
                />
              </Form.Item>
              <Form.Item
                label="Avatar"
                className="w-full"
                name="avatarUrl"
                rules={[
                  {
                    required: true,
                    message: "Avatar is required!",
                  },
                ]}
              >
                <Input
                  prefix={<FontAwesomeIcon icon={faImage} className="mr-2" />}
                  placeholder="Input avatar..."
                />
              </Form.Item>
            </>
          )}
          <Form.Item
            label="Email"
            className="w-full"
            name="email"
            rules={[
              {
                required: true,
                message: "Email is required!",
              },
              {
                type: "email",
                message: "Email is invalid!",
              },
            ]}
          >
            <Input
              prefix={<FontAwesomeIcon icon={faEnvelope} className="mr-2" />}
              placeholder="Input email..."
            />
          </Form.Item>
          <Form.Item
            label="Password"
            className="w-full"
            name="password"
            rules={[
              {
                required: true,
                message: "Password is required!",
              },
            ]}
          >
            <Input.Password
              prefix={<FontAwesomeIcon icon={faLock} className="mr-2" />}
              iconRender={handleShowPasswordIcon}
              placeholder="Input password..."
            />
          </Form.Item>
          <Form.Item className="flex items-center justify-center">
            <Button
              htmlType="submit"
              className="bg-[#4096ff] hover:opacity-80"
              type="primary"
              loading={loading}
            >
              {isLogin ? "Login" : "Signup"}
            </Button>
          </Form.Item>
        </Form>
        <div>
          {isLogin ? "Didn't have an account?" : "Alredy have an account?"}{" "}
          <span
            className=" text-primary cursor-pointer underline"
            onClick={() => navigate(`/${isLogin ? "signup" : "login"}`)}
          >
            {isLogin ? "Sign up" : "Login"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginSignupForm;
