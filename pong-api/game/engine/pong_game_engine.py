import logging
from ..models import GameState

logger = logging.getLogger(__name__)


class PongGameEngine:
    def __init__(self, game_state: GameState):
        self.game_state = game_state
        self.game_height = game_state.game_height
        self.game_width = game_state.game_width
        self.paddle_height = game_state.paddle_height
        self.paddle_width = game_state.paddle_width
        self.paddle_offset = game_state.paddle_offset
        self.ball_radius = game_state.ball_diameter / 2
        self.player_move_step = game_state.move_step
        logger.info(
            "PongGameEngine initialized with game state: %s, game_height: %d, game_width: %d, paddle_height: %d, paddle_width: %d, paddle_offset: %d, ball_radius: %d, player_move_step: %d",
            game_state,
            self.game_height,
            self.game_width,
            self.paddle_height,
            self.paddle_width,
            self.paddle_offset,
            self.ball_radius,
            self.player_move_step,
        )

    def update_game_state(self):
        """
        Updates the game state, including ball position, collision detection,
        and scoring. Saves the updated game state.
        """
        logger.info("GameEngine: Updating game state")
        if not self.game_state.is_game_running or self.game_state.is_game_ended:
            logger.info("Game is not running or has ended")
            return

        # Update the positions of the ball
        self.game_state.ball_x_position += self.game_state.ball_x_direction
        self.game_state.ball_y_position += self.game_state.ball_y_direction
        logger.debug(
            "Ball position updated: x=%s, y=%s",
            self.game_state.ball_x_position,
            self.game_state.ball_y_position,
        )

        # Check for collisions with the top and bottom walls
        self._check_wall_collisions()
        self._check_paddle_collision()
        self._check_scoring()

        self.game_state.save()
        logger.debug("GameEngine: Game state saved")

    def move_player(self, player_id, direction):
        logger.debug("Moving player: player_id=%s, direction=%s", player_id, direction)
        if not self.game_state.is_game_running or self.game_state.is_game_ended:
            logger.info("Game is not running or has ended")
            return

        if player_id == self.game_state.player_1_id:
            player_position = self.game_state.player_1_position
        elif player_id == self.game_state.player_2_id:
            player_position = self.game_state.player_2_position
        else:
            logger.warning("Invalid player_id: %s", player_id)
            return

        if direction == 1:
            player_position += self.player_move_step
        elif direction == -1:
            player_position -= self.player_move_step

        # Ensure the player doesn't move out of bounds
        player_position = max(
            0, min(self.game_height - self.paddle_height, player_position)
        )

        if player_id == self.game_state.player_1_id:
            self.game_state.player_1_position = player_position
        elif player_id == self.game_state.player_2_id:
            self.game_state.player_2_position = player_position

        # Save the updated player state
        self.game_state.save()
        logger.debug(
            "Player position updated and saved: player_id=%s, position=%s",
            player_id,
            player_position,
        )

    def _check_wall_collisions(self):
        """
        Checks for collisions between the ball and the top or bottom walls.
        Reverses the ball's direction if a collision is detected.
        """
        if self.game_state.ball_y_position - self.ball_radius <= 0:
            self.game_state.ball_y_direction *= -1
            self.game_state.ball_y_position += self.game_state.ball_y_direction
            logger.debug(
                "Ball collided with top wall and bounced back. New direction: %d",
                self.game_state.ball_y_direction,
            )
        elif self.game_state.ball_y_position + self.ball_radius >= self.game_height:
            self.game_state.ball_y_direction *= -1
            self.game_state.ball_y_position += self.game_state.ball_y_direction
            logger.debug(
                "Ball collided with bottom wall and bounced back. New direction y: %d; x: %d",
                self.game_state.ball_y_direction,
                self.game_state.ball_x_direction,
            )

    def _check_paddle_collision(self):
        """
        Checks for collisions between the ball and the paddles.
        Reverses the ball's direction if a collision is detected.
        """
        player_id_to_check = None

        if (
            self.paddle_offset
            <= self.game_state.ball_x_position - self.ball_radius
            <= self.paddle_offset + self.paddle_width
        ):
            # ball might hit paddle player_1
            player_id_to_check = self.game_state.player_1_id
            pass
        elif (
            self.game_state.game_width - (self.paddle_width + self.paddle_offset)
            <= self.game_state.ball_x_position + self.ball_radius
            <= self.game_state.game_width - self.paddle_offset
        ):
            # ball might hit paddle player_2
            player_id_to_check = self.game_state.player_2_id
            pass
        else:
            # No possibility of hit
            return

        logger.info(
            "Ball possibly collided with paddles. Position y: %d ; x: %d",
            self.game_state.ball_y_position,
            self.game_state.ball_x_position,
        )

        if self._handle_paddle_collision(player_id_to_check):
            self.game_state.ball_x_direction *= -1
            logger.info(
                "New ball position after colliding with player_%d y: %d ; x: %d",
                player_id_to_check,
                self.game_state.ball_y_position,
                self.game_state.ball_x_position,
            )

    def _handle_paddle_collision(self, player_id):
        """
        Handles the collision between the ball and a paddle.
        Updates the ball's direction based on the collision point.

        Args:
            player_id (int): The ID of the player whose paddle collided with the ball.
        """
        logger.info(
            "Handling paddle collision for player_id=%s, \
            player_1_id=%s, player_2_id=%s, player_1_position=%s, \
            player_2_position=%s",
            player_id,
            self.game_state.player_1_id,
            self.game_state.player_2_id,
            self.game_state.player_1_position,
            self.game_state.player_2_position,
        )

        # Match ID and find corresponding paddle
        if player_id == self.game_state.player_1_id:
            paddle_top = self.game_state.player_1_position
        elif player_id == self.game_state.player_2_id:
            paddle_top = self.game_state.player_2_position
        else:
            logger.warning("Invalid player_id for paddle collision: %s", player_id)
            return False

        paddle_bottom = paddle_top + self.paddle_height
        paddle_middle = (paddle_top + paddle_bottom) / 2
        ball_y = self.game_state.ball_y_position
        if ball_y < paddle_top or ball_y > paddle_bottom:
            logger.info("Bally Y position outside of paddle")
            return False

        # find new ball's Y direction in a range of 0.5 to -0.5
        # hit_distance_to_center = ball_y - paddle_middle
        # normalized_hit_distance = hit_distance_to_center / (self.paddle_height / 2)
        # normalized_hit_distance = max(-3, min(3, normalized_hit_distance))
        # self.ball_y_direction = normalized_hit_distance
        #
        # if hit_distance_to_center > (paddle_bottom - paddle_middle):
        #     logger.info(
        #         "ERROR: hit distance is larger than distance from \
        #     paddle center to paddle bottom. Setting hit_distance_to_center \
        #     to paddle_bottom - paddle_middle. Needs review"
        #     )
        #     hit_distance_to_center = paddle_bottom - paddle_middle

        return True

    def _check_scoring(self):
        """
        Checks if a player has scored a point. Updates the score and handles
        the scoring event.
        """
        if self.game_state.ball_x_position - self.ball_radius <= 0:
            self._handle_score_point(self.game_state.player_2_id)
            logger.info("Player 2 scored a point")
        elif self.game_state.ball_x_position + self.ball_radius >= self.game_width:
            self._handle_score_point(self.game_state.player_1_id)
            logger.info("Player 2 scored a point")

    def _handle_score_point(self, player_id):
        """
        Handles the event when a player scores a point.
        Updates the player's score, resets the ball position and direction,
        and checks if the game has ended based on the maximum score.

        Args:
            player_id (int): The ID of the player who scored.
        """
        logger.info(f"_handle_score_point() for player id: {player_id}")
        if player_id == self.game_state.player_1_id:
            self.game_state.player_1_score += 1
        elif player_id == self.game_state.player_2_id:
            self.game_state.player_2_score += 1

        logger.info(
            "Player scored: player_id=%s, player_1_score=%s, player_2_score=%s",
            player_id,
            self.game_state.player_1_score,
            self.game_state.player_2_score,
        )

        # Reset the ball position and direction
        self.game_state.ball_x_position = self.game_width // 2
        self.game_state.ball_y_position = self.game_height // 2
        self.game_state.ball_x_direction *= -1
        self.game_state.ball_y_direction *= -1

        # Check if the game has ended
        if self.game_state.player_1_score >= self.game_state.max_score:
            self.game_state.is_game_ended = True
            self.game_state.is_game_running = False
            logger.info("Game ended: player 1 won")
        elif self.game_state.player_2_score >= self.game_state.max_score:
            self.game_state.is_game_ended = True
            self.game_state.is_game_running = False
            logger.info("Game ended: player 2 won")
