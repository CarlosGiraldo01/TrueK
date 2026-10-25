import { ratingsRepository } from "./ratings.repository";

const getAverages = async () : Promise<Record<string, number>> =>{
  const rating = await ratingsRepository.findAll();
  const sums: Record<string,number> ={};
  const counts:Record<string,number> ={};

  rating.forEach((rating) => {
    const userId = rating.rated_user_id;
    sums [userId]= ( sums [userId]?? 0) + rating.rating;
    counts[userId]= (counts[userId] ?? 0) + 1;
  });
  const averages: Record<string, number> = {};
  Object.keys(sums).forEach((userId) => {
    averages[userId] = sums[userId] / counts[userId];
  });
  return averages
}
export const ratingsService = {
  getAll: () => ratingsRepository.findAll(),
  getById: (id: string) => ratingsRepository.findById(id),
  getAverages,
};