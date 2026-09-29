namespace ECS;

internal class Pair
{
	private string _display;

	private int _value;

	public string Display
	{
		get
		{
			return _display;
		}
		set
		{
			_display = value;
		}
	}

	public int Value
	{
		get
		{
			return _value;
		}
		set
		{
			_value = value;
		}
	}

	public Pair(int value, string display)
	{
		_display = $"{value} - {display}";
		_value = value;
	}
}
