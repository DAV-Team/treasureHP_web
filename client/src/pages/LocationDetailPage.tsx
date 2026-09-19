import { ArrowLeft, ArrowRight, Lightbulb, LockKeyhole, LockKeyholeOpen, MapPin, Navigation, Sparkles, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChallengeModal } from '../components/ChallengeModal';
import { Button } from '../components/common/Button';
import { Navbar } from '../components/common/Navbar';
import { ProgressBar } from '../components/common/ProgressBar';
import { SafeImage } from '../components/common/SafeImage';
import { categories } from '../lib/categories';
import { fallbackLocations, isObjectId, toMapLocation } from '../lib/mapLocations';
import { getChallenge, getLocation, type ApiLocation, type Challenge } from '../services/locations';

const fallbackMission = 'Hãy quan sát thật kỹ công trình và tìm chi tiết đặc biệt được nhắc đến trong hình ảnh ở thử thách.';
const fallbackHint = 'Hãy nhìn về các chi tiết trang trí trên phần mái và những cột lớn ở mặt tiền.';
const fallbackStory = 'Sau khi hoàn thành nhiệm vụ, bạn sẽ mở khóa câu chuyện thú vị về lịch sử, kiến trúc và văn hóa của địa điểm này.';

export function LocationDetailPage() {
  const { id } = useParams();
  const [showHint, setShowHint] = useState(false);
  const [isChallengeOpen, setChallengeOpen] = useState(false);
  const [remote, setRemote] = useState<ApiLocation | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);

  useEffect(() => {
    if (!id || !isObjectId(id)) return;
    getLocation(id).then(setRemote).catch(() => undefined);
    getChallenge(id).then(setChallenge).catch(() => undefined);
  }, [id]);

  const location = remote ? toMapLocation(remote) : fallbackLocations.find((item) => item.id === id) ?? fallbackLocations[0];
  const category = categories[location.category];
  const storyUnlocked = remote?.progress?.cultureStoryUnlocked ?? false;
  const totalQuestions = challenge?.questions.length ?? 3;
  const answered = remote?.progress?.status === 'completed' ? totalQuestions : 0;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.position.lat},${location.position.lng}`;

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <div className="relative h-48 overflow-hidden rounded-b-2xl bg-navy sm:h-64 lg:rounded-2xl">
          <SafeImage className="size-full object-cover" src={location.coverImageUrl} alt={location.name} />
          <div className="absolute inset-0 bg-gradient-to-b from-navy-deep/50 via-transparent to-transparent" />
          <Link to="/map" className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-black/40"><ArrowLeft className="size-3.5" /> Quay lại</Link>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">{location.name}</h1>
              <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold ${category.tint}`}><category.icon className="size-3.5" />{category.label}</span>
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
              <span className="flex items-center gap-1.5"><MapPin className="size-4 text-sky-600" />{location.address}</span>
              <a href={directionsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-navy hover:underline"><Navigation className="size-3.5" />Chỉ đường</a>
            </p>

            <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h2 className="flex items-center gap-2 text-base font-extrabold text-navy"><Sparkles className="size-5 text-gold" />Nhiệm vụ</h2>
              <p className="mt-3 leading-7 text-slate-600">{remote ? remote.shortDescription : fallbackMission}</p>
              <button type="button" className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-semibold text-navy transition hover:bg-slate-100" onClick={() => setShowHint(!showHint)}>
                <Lightbulb className="size-4 text-amber-500" />{showHint ? 'Ẩn gợi ý' : 'Xem gợi ý'}
              </button>
              {showHint && <p role="status" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">{fallbackHint}</p>}
              <Button className="mt-5 w-full" onClick={() => setChallengeOpen(true)}>Bắt đầu thử thách <ArrowRight className="size-4" /></Button>
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500"><Sparkles className="size-3.5" />Level 1</p>
              <h2 className="mt-1 text-lg font-extrabold text-navy">{challenge?.levelName ?? 'The Hidden Detail'}</h2>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1"><ProgressBar label="Tiến độ thử thách" value={(answered / totalQuestions) * 100} /></div>
                <span className="text-xs font-bold text-slate-500">{answered}/{totalQuestions}</span>
              </div>
              <p className="mt-4 flex items-center gap-2 text-lg font-extrabold text-navy"><Star className="size-6 fill-gold text-gold" />+{location.xp} XP</p>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-extrabold text-navy"><MapPin className="size-5" />Culture Story</h2>
                {storyUnlocked ? <LockKeyholeOpen className="size-5 text-emerald-500" aria-label="Đã mở khóa" /> : <LockKeyhole className="size-5 text-slate-400" aria-label="Đang khóa" />}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">{storyUnlocked ? remote?.cultureStory.content : remote ? 'Hoàn thành thử thách để mở khóa câu chuyện văn hóa tại địa điểm này.' : fallbackStory}</p>
              <SafeImage src={remote?.cultureStory.imageUrl ?? '/images/opera-story.jpg'} fallbackSrc="/images/opera-story.jpg" alt="" className={`mt-4 h-32 w-full rounded-xl object-cover transition ${storyUnlocked ? '' : 'opacity-70 saturate-50'}`} />
            </section>
          </aside>
        </div>
        <p className="sr-only">Địa điểm: {id}</p>
        <ChallengeModal isOpen={isChallengeOpen} onClose={() => setChallengeOpen(false)} locationId={remote?._id} />
      </main>
    </div>
  );
}
