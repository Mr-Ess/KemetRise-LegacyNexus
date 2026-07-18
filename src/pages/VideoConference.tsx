import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Video, VideoOff, Mic, MicOff, PhoneOff, Copy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { toAppUrl } from "@/lib/appUrl";

export default function VideoConference() {
  const nav = useNavigate();
  const { t } = useTranslation();
  const [room, setRoom] = useState("");
  const [joined, setJoined] = useState(false);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const generateRoom = () => {
    const id = "room-" + Math.random().toString(36).slice(2, 10);
    setRoom(id);
  };

  const join = async () => {
    if (!room.trim()) return toast.error("Enter a room ID");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setJoined(true);
      toast.success(`Joined ${room}`);
    } catch (e: any) {
      toast.error("Camera/mic access denied");
    }
  };

  const leave = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setJoined(false);
  };

  const toggleCam = () => {
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = !camOn; });
    setCamOn(!camOn);
  };
  const toggleMic = () => {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !micOn; });
    setMicOn(!micOn);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(toAppUrl(`video?room=${encodeURIComponent(room)}`));
    toast.success("Link copied");
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("room");
    if (r) setRoom(r);
    return () => leave();
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => nav("/")} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />{t('back_btn')}</Button>
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2 mb-6" style={{ fontFamily: "Orbitron" }}>
          <Video className="w-6 h-6" /> {t('tab_video_call')}
        </h1>

        {!joined ? (
          <Card className="p-6 max-w-md mx-auto space-y-4">
            <div>
              <Label>{t('room_id')}</Label>
              <div className="flex gap-2">
                <Input value={room} onChange={e => setRoom(e.target.value)} placeholder="e.g. team-meeting" />
                <Button variant="outline" onClick={generateRoom}>{t('generate_btn')}</Button>
              </div>
            </div>
            <Button onClick={join} className="w-full"><Video className="w-4 h-4 mr-2" />{t('join_room')}</Button>
            <p className="text-xs text-muted-foreground text-center">{t('share_room_hint')}</p>
          </Card>
        ) : (
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-primary" /> {t('room_label')} <span className="font-mono text-primary">{room}</span>
              </div>
              <Button size="sm" variant="outline" onClick={copyLink}><Copy className="w-3 h-3 mr-1" />{t('share_link')}</Button>
            </div>
            <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white">{t('you_label')}</div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Button size="lg" variant={micOn ? "default" : "destructive"} onClick={toggleMic}>
                {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </Button>
              <Button size="lg" variant={camOn ? "default" : "destructive"} onClick={toggleCam}>
                {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </Button>
              <Button size="lg" variant="destructive" onClick={() => { leave(); nav("/"); }}>
                <PhoneOff className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Local preview shown. Full WebRTC peer-to-peer signaling requires a TURN server (next phase).
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
