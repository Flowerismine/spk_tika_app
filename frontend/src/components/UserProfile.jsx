import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { LogOut, reset } from "../features/authSlice";

import { AiOutlineLogout } from "react-icons/ai";

import { Button } from '.';
import { useStateContext } from '../contexts/ContextProvider';

const UserProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const { currentColor } = useStateContext();

  const logout = async () => {
    await dispatch(LogOut());
    dispatch(reset());
    navigate("/");
  };

  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  return (
    <div className="nav-item absolute right-1 top-16 bg-white dark:bg-[#42464D] p-8 rounded-lg w-96">
      <div className="flex gap-5 items-center mt-6 border-color border-b-1 pb-6">
        <div>
          <p className="font-semibold text-xl dark:text-gray-200"> {user ? user.nama : "admin"} </p>
          <p className="text-gray-500 text-sm dark:text-gray-400"> 
          {user ? capitalizeFirstLetter(user.username) : "Admin"}  
          </p>
          <p className="text-gray-500 text-sm font-semibold dark:text-gray-400"> {user ? user.email : "email@gmail.com"} </p>
        </div>
      </div>
      <div className="mt-5">
        <Button
          onClick={logout} color="white" bgColor={currentColor} borderRadius="10px" icon={<AiOutlineLogout />} text='Keluar'
        />
      </div>
    </div>

  );
};

export default UserProfile;
