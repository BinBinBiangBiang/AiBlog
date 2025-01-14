'use client';

import { useState, useEffect, use } from 'react';
import http from '@/lib/http';

export default function About() {
  const [inputValue, setInputValue] = useState<any>([]);
  const fetchUsers = async () => {
    const res = await http.get('api/users');
    console.log('res.data=========>', res.data.data);
    setInputValue(res.data);
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
          <div key={index}>
            <ul>
              <li>
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
