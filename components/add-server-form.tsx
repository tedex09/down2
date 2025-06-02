"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

const serverSchema = z.object({
  url: z
    .string()
    .min(1, { message: 'URL is required' })
    .refine((val) => val.startsWith('http://') || val.startsWith('https://'), {
      message: 'URL must start with http:// or https://',
    }),
  username: z.string().min(1, { message: 'Username is required' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type ServerFormValues = z.infer<typeof serverSchema>;

interface AddServerFormProps {
  onServerAdded: () => void;
}

export function AddServerForm({ onServerAdded }: AddServerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ServerFormValues>({
    resolver: zodResolver(serverSchema),
    defaultValues: {
      url: '',
      username: '',
      password: '',
    },
  });

  async function onSubmit(data: ServerFormValues) {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/servers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add server');
      }

      form.reset();
      toast({
        title: 'Server added',
        description: 'The IPTV server has been added successfully.',
      });
      onServerAdded();
    } catch (error) {
      console.error('Error adding server:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add server. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Server URL</FormLabel>
              <FormControl>
                <Input placeholder="http://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding Server...
            </>
          ) : (
            'Add Server'
          )}
        </Button>
      </form>
    </Form>
  );
}