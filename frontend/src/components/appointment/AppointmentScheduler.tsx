import React, { useState, useEffect } from 'react';
import { format, addDays, isBefore, isAfter, parseISO, formatISO } from 'date-fns';
import { Calendar, Clock, Clock3, X, Check, Loader2, CalendarDays } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface TimeSlot {
  start_time: string;
  end_time: string;
  confidence: number;
}

interface Appointment {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

const AppointmentScheduler: React.FC = () => {
  const [step, setStep] = useState<'form' | 'slots' | 'confirmation'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    preferredDate: format(new Date(), 'yyyy-MM-dd'),
    preferredTime: '14:00',
    duration: 30,
  });

  // Fetch user's appointments
  useEffect(() => {
    fetchUserAppointments();
  }, []);

  const fetchUserAppointments = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/appointments/my-appointments', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFindSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter a title for your appointment');
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:8000/api/appointments/suggest-slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: 'current-user-id', // This would come from auth context in a real app
          title: formData.title,
          description: formData.description,
          preferred_date: formData.preferredDate,
          preferred_time: formData.preferredTime,
          duration_minutes: parseInt(formData.duration.toString(), 10),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to find available slots');
      }

      const slots = await response.json();
      setTimeSlots(slots);
      setStep('slots');
    } catch (error: any) {
      console.error('Error finding slots:', error);
      toast.error(error.message || 'Failed to find available time slots');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedSlot) return;

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:8000/api/appointments/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          start_time: selectedSlot.start_time,
          end_time: selectedSlot.end_time,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to book appointment');
      }

      const appointment = await response.json();
      setAppointments(prev => [appointment, ...prev]);
      setStep('confirmation');
      toast.success('Appointment booked successfully!');
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      toast.error(error.message || 'Failed to book appointment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8000/api/appointments/${appointmentId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to cancel appointment');
      }

      // Update the appointments list
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId ? { ...apt, status: 'cancelled' } : apt
        )
      );
      
      toast.success('Appointment cancelled successfully');
    } catch (error: any) {
      console.error('Error cancelling appointment:', error);
      toast.error(error.message || 'Failed to cancel appointment');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      preferredDate: format(new Date(), 'yyyy-MM-dd'),
      preferredTime: '14:00',
      duration: 30,
    });
    setSelectedSlot(null);
    setTimeSlots([]);
    setStep('form');
  };

  // Filter appointments based on active tab
  const filteredAppointments = appointments.filter(apt => {
    const now = new Date();
    const aptDate = new Date(apt.start_time);
    return activeTab === 'upcoming' 
      ? aptDate >= now && apt.status !== 'cancelled'
      : aptDate < now || apt.status === 'cancelled';
  });

  // Format date and time for display
  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: format(date, 'MMM d, yyyy'),
      time: format(date, 'h:mm a'),
      full: format(date, 'EEEE, MMMM d, yyyy h:mm a')
    };
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">AI-Powered Appointment Scheduler</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Appointment Form / Slots */}
        <div className="lg:col-span-2 space-y-6">
          {step === 'form' && (
            <form onSubmit={handleFindSlots} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Appointment Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="E.g., Legal Consultation, Case Review"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Briefly describe the purpose of this appointment..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="preferredDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Date
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarDays className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="preferredDate"
                      name="preferredDate"
                      value={formData.preferredDate}
                      onChange={handleInputChange}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="preferredTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Time
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="time"
                      id="preferredTime"
                      name="preferredTime"
                      value={formData.preferredTime}
                      onChange={handleInputChange}
                      className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <select
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min</option>
                    <option value="90">90 min</option>
                    <option value="120">120 min</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !formData.title.trim()}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    isLoading || !formData.title.trim()
                      ? 'bg-blue-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Finding Available Slots...
                    </>
                  ) : (
                    'Find Available Slots'
                  )}
                </button>
              </div>
            </form>
          )}
          
          {step === 'slots' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Available Time Slots</h3>
                <button
                  onClick={() => setStep('form')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  ← Back to form
                </button>
              </div>
              
              <div className="space-y-2">
                {timeSlots.length > 0 ? (
                  timeSlots.map((slot, index) => {
                    const start = new Date(slot.start_time);
                    const end = new Date(slot.end_time);
                    const isSelected = selectedSlot?.start_time === slot.start_time;
                    
                    return (
                      <div 
                        key={index}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-4 border rounded-md cursor-pointer transition-colors ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-5 w-5 rounded-full border flex items-center justify-center mr-3 ${
                            isSelected 
                              ? 'bg-blue-500 border-blue-500 text-white' 
                              : 'border-gray-300'
                          }`}>
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          <div>
                            <div className="font-medium">
                              {format(start, 'EEEE, MMMM d, yyyy')}
                            </div>
                            <div className="text-sm text-gray-600">
                              {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
                              <span className="ml-2 text-xs text-gray-500">
                                ({Math.round((new Date(slot.end_time).getTime() - new Date(slot.start_time).getTime()) / (1000 * 60))} min)
                              </span>
                            </div>
                          </div>
                          {slot.confidence && (
                            <div className="ml-auto text-xs text-gray-500">
                              {Math.round(slot.confidence * 100)}% match
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No available time slots found for the selected criteria.</p>
                    <button
                      onClick={() => setStep('form')}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Try different options
                    </button>
                  </div>
                )}
              </div>
              
              {timeSlots.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={handleBookAppointment}
                    disabled={!selectedSlot || isLoading}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      !selectedSlot || isLoading
                        ? 'bg-blue-300 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Booking...
                      </>
                    ) : (
                      'Book Selected Slot'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
          
          {step === 'confirmation' && selectedSlot && (
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Appointment Booked!</h3>
              <p className="text-gray-600 mb-6">
                Your appointment has been successfully scheduled for{' '}
                <span className="font-medium">
                  {formatDateTime(selectedSlot.start_time).full}
                </span>
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={resetForm}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Schedule Another
                </button>
                <button
                  onClick={() => setActiveTab('upcoming')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  View My Appointments
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Right Column - Appointments List */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex border-b border-gray-200 mb-4">
              <button
                className={`py-2 px-4 font-medium text-sm ${
                  activeTab === 'upcoming'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('upcoming')}
              >
                Upcoming
              </button>
              <button
                className={`py-2 px-4 font-medium text-sm ${
                  activeTab === 'past'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('past')}
              >
                Past/Cancelled
              </button>
            </div>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {isLoading && filteredAppointments.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin h-6 w-6 text-gray-400" />
                </div>
              ) : filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment) => {
                  const { date, time, full } = formatDateTime(appointment.start_time);
                  const isPast = new Date(appointment.end_time) < new Date();
                  const isCancelled = appointment.status === 'cancelled';
                  
                  return (
                    <div 
                      key={appointment.id}
                      className={`p-3 border rounded-md ${
                        isCancelled 
                          ? 'bg-gray-50 border-gray-200'
                          : isPast 
                            ? 'bg-white border-gray-200'
                            : 'bg-white border-blue-100'
                      }`}
                    >
                      <div className="flex justify-between">
                        <div>
                          <h4 className={`font-medium ${
                            isCancelled ? 'text-gray-500 line-through' : 'text-gray-900'
                          }`}>
                            {appointment.title}
                          </h4>
                          <div className="text-sm text-gray-600 mt-1">
                            <div className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                              <span>{date}</span>
                            </div>
                            <div className="flex items-center mt-1">
                              <Clock3 className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                              <span>{time}</span>
                            </div>
                          </div>
                        </div>
                        {isCancelled ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Cancelled
                          </span>
                        ) : isPast ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Completed
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelAppointment(appointment.id);
                            }}
                            className="text-xs text-red-600 hover:text-red-800"
                            disabled={isLoading}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                      {appointment.description && (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                          {appointment.description}
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No {activeTab} appointments found.</p>
                  {activeTab === 'upcoming' && (
                    <button
                      onClick={() => setStep('form')}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Schedule an appointment
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h4 className="font-medium text-blue-800 mb-2">Need help?</h4>
            <p className="text-sm text-blue-700 mb-3">
              Our AI assistant can help you find the perfect time for your appointment.
            </p>
            <button
              onClick={() => setStep('form')}
              className="w-full bg-white text-blue-600 hover:bg-blue-100 text-sm font-medium py-2 px-4 border border-blue-200 rounded-md transition-colors"
            >
              Talk to Scheduling Assistant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentScheduler;
