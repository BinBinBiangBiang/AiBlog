'use client';

import axios from 'axios';
import { useState, useEffect, use } from 'react';

export default function About() {
  const [inputValue, setInputValue] = useState<any>([]);
  const fetchUsers = async () => {
    const res = await axios.get('http://localhost:3000/api/users');
    console.log('res.data=========>', res.data.data);
    setInputValue(res.data.data);
    // 使用 data
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    console.log('inputValue=========>', inputValue);
  }, [inputValue]);

  return (
    <div className="mt-16">
      后端下发数据：{' '}
      {inputValue.map((item: any, index: any) => {
        return (
          <div>
            <ul>
              <li key={index}>
                <p>name: {item.name}</p>
                <p>email: {item.email}</p>
                <p>password: {item.password}</p>
              </li>
            </ul>
          </div>
        );
      })}
    </div>
  );
}
